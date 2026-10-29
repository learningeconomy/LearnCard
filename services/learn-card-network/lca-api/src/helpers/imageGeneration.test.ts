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
const logs = { error: vi.fn(), warn: vi.fn(), info: vi.fn() };
beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    logs.error = vi.spyOn(console, 'error').mockImplementation(() => undefined) as never;
    logs.warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined) as never;
    logs.info = vi.spyOn(console, 'info').mockImplementation(() => undefined) as never;
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
    it('keeps the explicit DALL-E fallback: URL upload, no Bedrock call', async () => {
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
    it('bounds the request timeout, aborts the invocation and maps it to 503', async () => {
        vi.useFakeTimers();
        send.mockImplementation(() => new Promise(() => {}));
        const pending = generateStoredImage('badge', 'did', config, undefined, storage);
        const check = expect(pending).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
        await vi.advanceTimersByTimeAsync(1000);
        await check;
        expect(send.mock.calls[0]![1].abortSignal.aborted).toBe(true);
        expect(logs.error.mock.calls[0]![0]).toMatchObject({
            event: 'image_generation_failure',
            stage: 'timeout',
            clientCode: 'SERVICE_UNAVAILABLE',
        });
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
    it('defaults to Bedrock and validates explicit image configuration', () => {
        expect(parseLcaApiEnvironment({ NODE_ENV: 'test' })).toMatchObject({
            ...config,
            IMAGE_PROVIDER: 'bedrock',
            IMAGE_TIMEOUT_MS: 25000,
        });
        expect(parseLcaApiEnvironment({ NODE_ENV: 'test', IMAGE_PROVIDER: '' })).toMatchObject({
            IMAGE_PROVIDER: 'bedrock',
        });
        expect(
            parseLcaApiEnvironment({ NODE_ENV: 'test', IMAGE_PROVIDER: 'openai' })
        ).toMatchObject({ IMAGE_PROVIDER: 'openai' });
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

    const awsError = (name: string, status: number, message = 'secret provider body') =>
        Object.assign(new Error(message), {
            name,
            $fault: status >= 500 ? 'server' : 'client',
            $metadata: { httpStatusCode: status, requestId: 'req-123e4567-e89b' },
        });
    const budget = { ...config, IMAGE_TIMEOUT_MS: 25_000 };
    it.each([
        // Bedrock reports some account quotas as HTTP 400, which previously became a 500.
        ['ServiceQuotaExceededException', 400, 'TOO_MANY_REQUESTS'],
        ['ThrottlingException', 429, 'TOO_MANY_REQUESTS'],
        ['ModelNotReadyException', 429, 'TOO_MANY_REQUESTS'],
        ['ServiceUnavailableException', 503, 'SERVICE_UNAVAILABLE'],
        ['InternalServerException', 500, 'SERVICE_UNAVAILABLE'],
        ['ModelTimeoutException', 408, 'SERVICE_UNAVAILABLE'],
        ['AccessDeniedException', 403, 'INTERNAL_SERVER_ERROR'],
        ['ResourceNotFoundException', 404, 'INTERNAL_SERVER_ERROR'],
        ['ValidationException', 400, 'INTERNAL_SERVER_ERROR'],
        ['ModelErrorException', 424, 'INTERNAL_SERVER_ERROR'],
    ])('maps Bedrock %s (HTTP %i) to %s', async (name, status, code) => {
        send.mockRejectedValue(awsError(name, status));
        const error = await generateStoredImage('badge', 'did', config, undefined, storage).catch(
            (e: unknown) => e
        );
        expect(error).toMatchObject({ code });
        expect(JSON.stringify(error)).not.toContain('secret');
        expect((error as Error).message).not.toContain('secret');
        expect(storage.upload).not.toHaveBeenCalled();
    });
    it('maps a content-filter ValidationException to a sanitized 400', async () => {
        send.mockRejectedValue(
            awsError(
                'ValidationException',
                400,
                'This request has been blocked by our content filters.'
            )
        );
        await expect(
            generateStoredImage('badge', 'did', budget, undefined, storage)
        ).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: 'The image request was filtered.',
        });
        expect(send).toHaveBeenCalledOnce();
    });
    it('gives the upload only the time left in the request budget', async () => {
        vi.useFakeTimers();
        try {
            send.mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve({ body: payload() }), 20_000))
            );
            const pending = generateStoredImage('badge', 'did', budget, undefined, storage);
            await vi.advanceTimersByTimeAsync(20_000);
            await expect(pending).resolves.toEqual({ url: 'https://stored/image' });
            // 20 s of the 25 s budget went to Bedrock, so storage gets the remaining 5 s.
            expect(storage.upload).toHaveBeenCalledWith(
                png,
                { timeout: 5_000 },
                { filename: 'generated-image.png' }
            );
        } finally {
            vi.useRealTimers();
        }
    });
    it('retries throttling with jitter inside the deadline, then succeeds', async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        send.mockRejectedValueOnce(awsError('ThrottlingException', 429))
            .mockRejectedValueOnce(awsError('ServiceQuotaExceededException', 400))
            .mockResolvedValueOnce({ body: payload() });
        await expect(
            generateStoredImage('badge', 'did', budget, undefined, storage)
        ).resolves.toEqual({ url: 'https://stored/image' });
        expect(send).toHaveBeenCalledTimes(3);
        expect(storage.upload).toHaveBeenCalledOnce();
        expect(destroy).toHaveBeenCalledOnce();
        expect(logs.warn).toHaveBeenCalledTimes(2);
        expect(logs.warn.mock.calls[0]![0]).toMatchObject({
            event: 'image_generation_retry',
            errorName: 'ThrottlingException',
            attempt: 1,
        });
        expect(logs.info.mock.calls[0]![0]).toMatchObject({
            event: 'image_generation_success',
            attempts: 3,
        });
        expect(logs.error).not.toHaveBeenCalled();
    });
    it('stops after three attempts and returns 429', async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        send.mockRejectedValue(awsError('ThrottlingException', 429));
        await expect(
            generateStoredImage('badge', 'did', budget, undefined, storage)
        ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
        expect(send).toHaveBeenCalledTimes(3);
        expect(logs.error.mock.calls[0]![0]).toMatchObject({ attempts: 3, retryable: true });
    });
    it('does not retry when a full attempt no longer fits the deadline', async () => {
        send.mockRejectedValue(awsError('ThrottlingException', 429));
        await expect(
            generateStoredImage('badge', 'did', config, undefined, storage)
        ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
        expect(send).toHaveBeenCalledOnce();
    });
    it.each([
        ['AccessDeniedException', 403],
        ['ValidationException', 400],
        ['ModelTimeoutException', 408],
    ])('never retries %s (possibly billed or permanent)', async (name, status) => {
        send.mockRejectedValue(awsError(name, status));
        await generateStoredImage('badge', 'did', budget, undefined, storage).catch(() => {});
        expect(send).toHaveBeenCalledOnce();
    });
    it('logs one sanitized failure record without prompt, provider message or secrets', async () => {
        const prompt = 'SECRET-PROMPT a badge for Jane Doe jane@example.com';
        send.mockRejectedValue(
            Object.assign(
                awsError('ServiceQuotaExceededException', 400, 'quota detail AKIASECRETKEY'),
                {
                    $response: {
                        headers: { authorization: 'AWS4-HMAC-SHA256 Credential=AKIASECRETKEY' },
                    },
                    $retryable: { throttling: true },
                }
            )
        );
        await generateStoredImage(prompt, 'did:example:user', config, undefined, storage).catch(
            () => {}
        );
        expect(logs.error).toHaveBeenCalledOnce();
        const record = logs.error.mock.calls[0]![0];
        expect(record).toEqual({
            event: 'image_generation_failure',
            provider: 'bedrock',
            modelId: 'stability.stable-image-core-v1:1',
            region: 'us-west-2',
            durationMs: expect.any(Number),
            promptLength: prompt.length,
            promptHash: expect.stringMatching(/^[0-9a-f]{12}$/),
            stage: 'invoke',
            attempts: 1,
            category: 'throttled',
            errorName: 'ServiceQuotaExceededException',
            errorCode: undefined,
            httpStatus: 400,
            awsRequestId: 'req-123e4567-e89b',
            sdkRetryable: true,
            retryable: true,
            finishReason: undefined,
            decodeReason: undefined,
            clientCode: 'TOO_MANY_REQUESTS',
        });
        const logged = JSON.stringify([logs.error.mock.calls, logs.warn.mock.calls]);
        for (const secret of [
            'SECRET',
            'jane',
            'AKIA',
            'Credential',
            'authorization',
            'quota detail',
            'did:example',
        ])
            expect(logged).not.toContain(secret);
    });
    it('logs filter finish reasons and decode reasons, never image bytes', async () => {
        send.mockResolvedValue({ body: payload({ finish_reasons: ['Filter reason: prompt'] }) });
        await generateStoredImage('badge', 'did', config, undefined, storage).catch(() => {});
        expect(logs.error.mock.calls[0]![0]).toMatchObject({
            stage: 'decode',
            finishReason: 'Filter reason: prompt',
            decodeReason: 'filtered',
            clientCode: 'BAD_REQUEST',
        });
        const image = Buffer.from(png);
        image.writeUInt32BE(800, 16);
        send.mockResolvedValue({ body: payload({ images: [image.toString('base64')] }) });
        await generateStoredImage('badge', 'did', config, undefined, storage).catch(() => {});
        expect(logs.error.mock.calls[1]![0]).toMatchObject({
            stage: 'decode',
            finishReason: null,
            decodeReason: 'png_dimensions_invalid',
            clientCode: 'INTERNAL_SERVER_ERROR',
        });
        expect(JSON.stringify(logs.error.mock.calls)).not.toContain(
            png.toString('base64').slice(0, 40)
        );
    });
    it('logs storage failures by stage without the storage message or URL', async () => {
        storage.upload.mockRejectedValue(
            Object.assign(new Error('https://secret.storage/url?signature=abc'), { status: 403 })
        );
        await expect(
            generateStoredImage('badge', 'did', config, undefined, storage)
        ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
        const record = logs.error.mock.calls[0]![0];
        expect(record).toMatchObject({ stage: 'storage', storage: { httpStatus: 403 } });
        expect(JSON.stringify(record)).not.toContain('secret');
    });
});
