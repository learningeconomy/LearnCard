import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
    AI_PRIVACY_ASSET_DIR,
    AI_PRIVACY_OCR_LANGUAGES,
    AI_PRIVACY_PYTHON,
} from '../constants/env';

export const MAX_LOCAL_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FRAME_BYTES = 15 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_QUEUED_BYTES = 32 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 180_000;
const START_TIMEOUT_MS = 120_000;

type Pending = {
    id: number;
    frame: string;
    bytes: number;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
};

const unavailable = () => new Error('Local privacy processor unavailable');
const assetDirectory = () => {
    if (AI_PRIVACY_ASSET_DIR) return AI_PRIVACY_ASSET_DIR;
    // Source execution, bundled API, and bundled nested workers/MCP entrypoints.
    const candidates = [
        new URL('../../privacy/', import.meta.url),
        new URL('./privacy/', import.meta.url),
        new URL('../privacy/', import.meta.url),
    ];
    const directory = candidates.find(url => existsSync(new URL('processor.py', url)));
    if (!directory) throw unavailable();
    return fileURLToPath(directory);
};

class LocalPrivacyProcessor {
    private child: ChildProcessWithoutNullStreams | undefined;
    private ready = false;
    private buffer = Buffer.alloc(0);
    private queue: Pending[] = [];
    private active: Pending | undefined;
    private queuedBytes = 0;
    private nextId = 0;
    private startupTimer: NodeJS.Timeout | undefined;
    private restartAfter = 0;

    constructor() {
        process.once('exit', () => this.kill());
    }

    private kill() {
        const child = this.child;
        this.child = undefined;
        if (child?.pid) {
            try {
                // A separate POSIX process group also owns any active local OCR process.
                process.kill(-child.pid, 'SIGKILL');
            } catch {
                child.kill('SIGKILL');
            }
        }
    }

    private fail() {
        clearTimeout(this.startupTimer);
        this.startupTimer = undefined;
        this.kill();
        this.ready = false;
        this.buffer = Buffer.alloc(0);
        this.restartAfter = Date.now() + 5_000;
        const pending = this.active ? [this.active, ...this.queue] : this.queue;
        this.active = undefined;
        this.queue = [];
        this.queuedBytes = 0;
        for (const item of pending) {
            clearTimeout(item.timer);
            item.reject(unavailable());
        }
    }

    private start() {
        if (this.child) return;
        const assets = assetDirectory();
        // Do not forward application secrets or provider credentials to the worker.
        const child = spawn(AI_PRIVACY_PYTHON, ['-u', join(assets, 'processor.py')], {
            detached: true,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                PATH: process.env.PATH,
                LANG: 'C.UTF-8',
                OMP_NUM_THREADS: '2',
                PYTHONDONTWRITEBYTECODE: '1',
                AI_PRIVACY_OCR_LANGUAGES,
            },
        });
        this.child = child;
        this.startupTimer = setTimeout(() => this.fail(), START_TIMEOUT_MS);
        child.on('error', () => {
            if (this.child === child) this.fail();
        });
        child.on('exit', () => {
            if (this.child === child) this.fail();
        });
        child.stdin.on('error', () => {
            if (this.child === child) this.fail();
        });
        // Library diagnostics can contain input; drain without logging or retaining.
        child.stderr.on('data', () => {});
        child.stdout.on('data', (data: Buffer) => {
            if (this.child !== child) return;
            if (this.buffer.length + data.length > MAX_RESPONSE_BYTES) return this.fail();
            this.buffer = Buffer.concat([this.buffer, data]);
            let newline: number;
            while ((newline = this.buffer.indexOf(10)) !== -1) {
                const frame = this.buffer.subarray(0, newline);
                this.buffer = this.buffer.subarray(newline + 1);
                try {
                    const result: unknown = JSON.parse(frame.toString('utf8'));
                    if (!result || typeof result !== 'object') return this.fail();
                    if (!this.ready) {
                        if (!('ready' in result) || result.ready !== true) return this.fail();
                        this.ready = true;
                        clearTimeout(this.startupTimer);
                        this.startupTimer = undefined;
                        this.drain();
                        continue;
                    }
                    const current = this.active;
                    if (
                        !current ||
                        !('id' in result) ||
                        result.id !== current.id ||
                        !('ok' in result)
                    )
                        return this.fail();
                    this.active = undefined;
                    this.queuedBytes -= current.bytes;
                    clearTimeout(current.timer);
                    if (result.ok === true && 'result' in result) current.resolve(result.result);
                    else current.reject(unavailable());
                    this.drain();
                } catch {
                    this.fail();
                    return;
                }
            }
        });
    }

    private drain() {
        if (!this.ready || !this.child || this.active) return;
        const item = this.queue.shift();
        if (!item) return;
        this.active = item;
        this.child.stdin.write(item.frame, error => {
            if (error && this.active === item) this.fail();
        });
    }

    request(payload: Record<string, string>): Promise<unknown> {
        if (Date.now() < this.restartAfter || this.queue.length + (this.active ? 1 : 0) >= 8) {
            return Promise.reject(unavailable());
        }
        this.nextId += 1;
        const id = this.nextId;
        const frame = `${JSON.stringify({ id, ...payload })}\n`;
        const bytes = Buffer.byteLength(frame);
        if (bytes > MAX_FRAME_BYTES || this.queuedBytes + bytes > MAX_QUEUED_BYTES) {
            return Promise.reject(new Error('Local privacy processing capacity exceeded'));
        }
        const { promise, resolve, reject } = Promise.withResolvers<unknown>();
        const pending: Pending = {
            id,
            frame,
            bytes,
            resolve,
            reject,
            timer: setTimeout(() => this.fail(), REQUEST_TIMEOUT_MS),
        };
        this.queue.push(pending);
        this.queuedBytes += bytes;
        try {
            this.start();
            this.drain();
        } catch {
            this.fail();
        }
        return promise;
    }
}

const processor = new LocalPrivacyProcessor();

/** Accepts validated base64 only; file bytes never enter a provider request. */
export const extractLocalFileText = async (mimeType: string, base64: string): Promise<string> => {
    if (base64.length > Math.ceil(MAX_LOCAL_FILE_BYTES / 3) * 4)
        throw new Error('File size limit exceeded');
    const response = await processor.request({ op: 'extract', mimeType, base64 });
    if (typeof response !== 'string' || response.length > 200_000) throw unavailable();
    return response;
};
