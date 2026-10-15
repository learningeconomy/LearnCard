import { beforeEach, describe, expect, it, vi } from 'vitest';
import type OpenAI from 'openai';
import { PNG } from 'pngjs';
import { deflateSync } from 'node:zlib';
const { send, destroy, constructor } = vi.hoisted(() => ({
    send: vi.fn(),
    destroy: vi.fn(),
    constructor: vi.fn(),
}));
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
    BedrockRuntimeClient: class {
        constructor(options: unknown) {
            constructor(options);
        }
        send = send;
        destroy = destroy;
    },
    InvokeModelCommand: class {
        constructor(public input: unknown) {}
    },
}));
import { decodeBedrockImage, generateStoredImage } from './imageGeneration';
import { parseLcaApiEnvironment } from '../config/environment';
const config = {
    IMAGE_PROVIDER: 'bedrock' as const,
    BEDROCK_IMAGE_REGION: 'us-west-2',
    BEDROCK_IMAGE_MODEL_ID: 'stability.stable-image-core-v1:1',
    IMAGE_TIMEOUT_MS: 1000,
};
const png = PNG.sync.write(new PNG({ width: 1024, height: 1024 }));
const payload = (overrides = {}): Buffer =>
    Buffer.from(
        JSON.stringify({ images: [png.toString('base64')], finish_reasons: [null], ...overrides })
    );
const storage = { upload: vi.fn(), storeURL: vi.fn() };
beforeEach(() => {
    vi.clearAllMocks();
    send.mockResolvedValue({ body: payload() });
    storage.upload.mockResolvedValue({ url: 'https://stored/image' });
});
describe('image adapter', () => {
    it('rejects duplicate headers and decompression bombs before PNG decoding', () => {
        const duplicate = Buffer.concat([png.subarray(0, 33), png.subarray(8)]);
        expect(() =>
            decodeBedrockImage(payload({ images: [duplicate.toString('base64')] }))
        ).toThrow();
        const compressed = deflateSync(Buffer.alloc(20 * 1024 * 1024 + 1));
        const chunk = Buffer.alloc(compressed.length + 12);
        chunk.writeUInt32BE(compressed.length, 0);
        chunk.write('IDAT', 4);
        compressed.copy(chunk, 8);
        const bomb = Buffer.concat([png.subarray(0, 33), chunk, png.subarray(png.length - 12)]);
        expect(() => decodeBedrockImage(payload({ images: [bomb.toString('base64')] }))).toThrow();
    });
    it('rejects truncated and corrupt PNG data', () => {
        for (const bytes of [png.subarray(0, 33), png.subarray(0, png.length - 12)]) {
            expect(() =>
                decodeBedrockImage(payload({ images: [bytes.toString('base64')] }))
            ).toThrow();
        }
        const corrupt = Buffer.from(png);
        corrupt[32] = corrupt[32]! ^ 1;
        expect(() =>
            decodeBedrockImage(payload({ images: [corrupt.toString('base64')] }))
        ).toThrow();
    });
    it('invokes the candidate once with square PNG and uploads bytes', async () => {
        await expect(
            generateStoredImage('badge', 'did:example:1', config, undefined, storage)
        ).resolves.toEqual({ url: 'https://stored/image' });
        expect(constructor).toHaveBeenCalledWith({
            region: 'us-west-2',
            maxAttempts: 1,
            authSchemePreference: ['sigv4'],
        });
        expect(send).toHaveBeenCalledTimes(1);
        expect(JSON.parse(send.mock.calls[0]![0].input.body)).toEqual({
            prompt: 'badge',
            aspect_ratio: '1:1',
            output_format: 'png',
        });
        expect(storage.upload).toHaveBeenCalledWith(
            png,
            { timeout: 1000 },
            { filename: 'generated-image.png' }
        );
        expect(storage.storeURL).not.toHaveBeenCalled();
        expect(destroy).toHaveBeenCalledOnce();
    });
    it('preserves DALL-E URL upload and does not invoke Bedrock', async () => {
        const generate = vi.fn().mockResolvedValue({ data: [{ url: 'https://openai/image' }] });
        storage.storeURL.mockResolvedValue({ url: 'https://stored/image' });
        await expect(
            generateStoredImage(
                'badge',
                'did:example:1',
                { ...config, IMAGE_PROVIDER: 'openai' },
                { images: { generate } } as unknown as OpenAI,
                storage
            )
        ).resolves.toEqual({ url: 'https://stored/image' });
        expect(generate.mock.calls[0]![0]).toEqual({
            prompt: 'badge',
            model: 'dall-e-3',
            size: '1024x1024',
            n: 1,
            user: 'did:example:1',
        });
        expect(generate.mock.calls[0]![1]).toMatchObject({ maxRetries: 0, timeout: 1000 });
        expect(storage.storeURL).toHaveBeenCalledWith('https://openai/image');
        expect(send).not.toHaveBeenCalled();
    });
    it.each(['Filter reason: prompt', 'Filter reason: output image', 'Filter reason: input image'])(
        'rejects filtering: %s',
        async reason => {
            send.mockResolvedValue({ body: payload({ finish_reasons: [reason] }) });
            await expect(
                generateStoredImage('badge', 'did', config, undefined, storage)
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message: 'The image request was filtered.',
            });
            expect(storage.upload).not.toHaveBeenCalled();
        }
    );
    it.each([
        { images: [] },
        { images: ['!!!'] },
        { images: ['AAAA'] },
        { images: [png.toString('base64'), png.toString('base64')] },
        { finish_reasons: [] },
        { finish_reasons: ['Inference error'] },
        { finish_reasons: [42] },
    ])('rejects malformed payload %j', value => {
        expect(() => decodeBedrockImage(payload(value))).toThrow();
    });
    it('rejects invalid JSON, oversized response, non-square or out-of-bounds PNG', () => {
        expect(() => decodeBedrockImage(Buffer.from('{'))).toThrow();
        expect(() => decodeBedrockImage(Buffer.alloc(14 * 1024 * 1024 + 1))).toThrow();
        for (const width of [639, 1537, 800]) {
            const image = Buffer.from(png);
            image.writeUInt32BE(width, 16);
            expect(() =>
                decodeBedrockImage(payload({ images: [image.toString('base64')] }))
            ).toThrow();
        }
    });
    it('sanitizes provider failures without fallback or duplicate calls', async () => {
        send.mockRejectedValue(new Error('secret prompt credentials'));
        await expect(
            generateStoredImage('badge', 'did', config, undefined, storage)
        ).rejects.toMatchObject({ message: 'Image generation failed. Please try again later.' });
        expect(send).toHaveBeenCalledOnce();
        expect(storage.upload).not.toHaveBeenCalled();
    });
    it.each([
        [429, 'TOO_MANY_REQUESTS', 'AI generation rate limited'],
        [503, 'SERVICE_UNAVAILABLE', 'Image generation unavailable. Please try again later.'],
        [504, 'SERVICE_UNAVAILABLE', 'Image generation unavailable. Please try again later.'],
        [400, 'INTERNAL_SERVER_ERROR', 'Image generation failed. Please try again later.'],
    ])('maps Bedrock HTTP %i to a sanitized %s', async (status, code, message) => {
        send.mockRejectedValue(
            Object.assign(new Error('secret provider body'), {
                $metadata: { httpStatusCode: status },
            })
        );
        const error = await generateStoredImage('badge', 'did', config, undefined, storage).catch(
            (e: unknown) => e
        );
        expect(error).toMatchObject({ code, message });
        expect(JSON.stringify(error)).not.toContain('secret');
        expect(send).toHaveBeenCalledOnce();
        expect(storage.upload).not.toHaveBeenCalled();
    });
    it('maps DALL-E rate limits without retrying', async () => {
        const generate = vi
            .fn()
            .mockRejectedValue(Object.assign(new Error('secret body'), { status: 429 }));
        await expect(
            generateStoredImage(
                'badge',
                'did',
                { ...config, IMAGE_PROVIDER: 'openai' },
                { images: { generate } } as unknown as OpenAI,
                storage
            )
        ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
        expect(generate).toHaveBeenCalledOnce();
        expect(storage.storeURL).not.toHaveBeenCalled();
    });
    it('does not map storage failures as provider throttling', async () => {
        storage.upload.mockRejectedValue(Object.assign(new Error('x'), { status: 429 }));
        await expect(
            generateStoredImage('badge', 'did', config, undefined, storage)
        ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
    });
    it('bounds the request timeout and aborts the invocation', async () => {
        vi.useFakeTimers();
        send.mockImplementation(() => new Promise(() => {}));
        const pending = generateStoredImage('badge', 'did', config, undefined, storage);
        const check = expect(pending).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
        await vi.advanceTimersByTimeAsync(1000);
        await check;
        expect(send.mock.calls[0]![1].abortSignal.aborted).toBe(true);
        vi.useRealTimers();
    });
    it('rejects oversized prompts before invoking or uploading', async () => {
        await expect(
            generateStoredImage('a'.repeat(10001), 'did', config, undefined, storage)
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(send).not.toHaveBeenCalled();
    });
    it('sanitizes storage failures and missing URLs', async () => {
        storage.upload.mockResolvedValue({});
        await expect(
            generateStoredImage('badge', 'did', config, undefined, storage)
        ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
        storage.upload.mockRejectedValue(new Error('secret storage URL'));
        await expect(
            generateStoredImage('badge', 'did', config, undefined, storage)
        ).rejects.toMatchObject({ message: 'Image generation failed. Please try again later.' });
    });
    it('defaults to OpenAI and validates explicit image configuration', () => {
        expect(parseLcaApiEnvironment({ NODE_ENV: 'test' })).toMatchObject({
            ...config,
            IMAGE_PROVIDER: 'openai',
            IMAGE_TIMEOUT_MS: 25000,
        });
        expect(
            parseLcaApiEnvironment({ NODE_ENV: 'test', IMAGE_TIMEOUT_MS: '25000' })
        ).toMatchObject({ IMAGE_TIMEOUT_MS: 25000 });
        for (const bad of [
            { IMAGE_PROVIDER: 'typo' },
            { BEDROCK_IMAGE_REGION: 'us-east-1' },
            { BEDROCK_IMAGE_MODEL_ID: 'amazon.nova-canvas-v1:0' },
            { IMAGE_TIMEOUT_MS: '0' },
            { IMAGE_TIMEOUT_MS: '25001' },
            { IMAGE_TIMEOUT_MS: '90000' },
        ])
            expect(() => parseLcaApiEnvironment({ NODE_ENV: 'test', ...bad })).toThrow();
    });
});
