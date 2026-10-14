import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { TRPCError } from '@trpc/server';
import type OpenAI from 'openai';
import { PNG } from 'pngjs';

export interface ImageGenerationConfig {
    IMAGE_PROVIDER: 'openai' | 'bedrock';
    BEDROCK_IMAGE_REGION: string;
    BEDROCK_IMAGE_MODEL_ID: string;
    IMAGE_TIMEOUT_MS: number;
}

interface ImageStorage {
    storeURL: (url: string) => Promise<{ url?: string }>;
    upload: (
        bytes: Buffer,
        options: { timeout: number },
        storeOptions: { filename: string }
    ) => Promise<{ url?: string }>;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 14 * 1024 * 1024;
const failure = (): TRPCError =>
    new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Image generation failed. Please try again later.',
    });

/** Validate a single unfiltered, bounded square PNG before handing bytes to storage. */
export const decodeBedrockImage = (body: Uint8Array): Buffer => {
    if (body.byteLength > MAX_RESPONSE_BYTES) throw failure();
    const result: unknown = JSON.parse(Buffer.from(body).toString('utf8'));
    if (!result || typeof result !== 'object') throw failure();
    const { images, finish_reasons: reasons } = result as Record<string, unknown>;
    if (!Array.isArray(reasons) || reasons.length !== 1) throw failure();
    if (typeof reasons[0] === 'string' && reasons[0].startsWith('Filter reason:')) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'The image request was filtered.' });
    }
    if (reasons[0] !== null || !Array.isArray(images) || images.length !== 1) throw failure();
    const encoded: unknown = images[0];
    if (
        typeof encoded !== 'string' ||
        !encoded.length ||
        encoded.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)
    )
        throw failure();
    const bytes = Buffer.from(encoded, 'base64');
    if (
        bytes.length < 33 ||
        bytes.length > MAX_IMAGE_BYTES ||
        bytes.toString('base64') !== encoded ||
        !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
        bytes.readUInt32BE(8) !== 13 ||
        bytes.toString('ascii', 12, 16) !== 'IHDR'
    )
        throw failure();
    const width = bytes.readUInt32BE(16);
    if (width !== bytes.readUInt32BE(20) || width < 640 || width > 1536) throw failure();
    // Dimensions are bounded before decode, preventing oversized pixel allocations.
    const image = PNG.sync.read(bytes, { checkCRC: true });
    if (image.width !== width || image.height !== width) throw failure();
    return bytes;
};

/** One paid invocation per request, with no provider fallback or SDK retries. */
export const generateStoredImage = async (
    prompt: string,
    did: string,
    config: ImageGenerationConfig,
    openai: OpenAI | undefined,
    storage: ImageStorage
): Promise<{ url: string }> => {
    if (config.IMAGE_PROVIDER === 'bedrock' && prompt.length > 10_000) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Image prompt exceeds 10000 characters.',
        });
    }
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const work = async (): Promise<{ url: string }> => {
        let stored: { url?: string };
        if (config.IMAGE_PROVIDER === 'bedrock') {
            const client = new BedrockRuntimeClient({
                region: config.BEDROCK_IMAGE_REGION,
                maxAttempts: 1,
            });
            try {
                const response = await client.send(
                    new InvokeModelCommand({
                        modelId: config.BEDROCK_IMAGE_MODEL_ID,
                        contentType: 'application/json',
                        accept: 'application/json',
                        body: JSON.stringify({ prompt, aspect_ratio: '1:1', output_format: 'png' }),
                    }),
                    { abortSignal: controller.signal }
                );
                const bytes = decodeBedrockImage(response.body);
                if (controller.signal.aborted) throw failure();
                stored = await storage.upload(
                    bytes,
                    { timeout: config.IMAGE_TIMEOUT_MS },
                    { filename: 'generated-image.png' }
                );
            } finally {
                client.destroy();
            }
        } else {
            if (!openai) throw failure();
            const response = await openai.images.generate(
                { prompt, model: 'dall-e-3', size: '1024x1024', n: 1, user: did },
                { signal: controller.signal, timeout: config.IMAGE_TIMEOUT_MS, maxRetries: 0 }
            );
            if (!response.data?.[0]?.url || controller.signal.aborted) throw failure();
            stored = await storage.storeURL(response.data[0].url);
        }
        if (!stored?.url) throw failure();
        return { url: stored.url };
    };
    try {
        return await Promise.race([
            work(),
            new Promise<never>((_, reject) => {
                timeout = setTimeout(() => {
                    controller.abort();
                    reject(failure());
                }, config.IMAGE_TIMEOUT_MS);
            }),
        ]);
    } catch (error) {
        if (error instanceof TRPCError && error.code === 'BAD_REQUEST') throw error;
        // Do not expose provider messages, prompts, credentials, URLs, or image payloads.
        throw failure();
    } finally {
        clearTimeout(timeout);
    }
};
