import { afterEach, describe, expect, it, vi } from 'vitest';
import { out } from './out';

afterEach(() => {
    out.json = false;
    out.result = {};
    vi.restoreAllMocks();
});

describe('out', () => {
    it('routes log to console.log in human mode', () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});

        out.json = false;
        out.log('hello', 1);

        expect(log).toHaveBeenCalledWith('hello', 1);
        expect(error).not.toHaveBeenCalled();
    });

    it('routes log to console.error in json mode, keeping stdout free for the result', () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});

        out.json = true;
        out.log('hidden from stdout');

        expect(error).toHaveBeenCalledWith('hidden from stdout');
        expect(log).not.toHaveBeenCalled();
    });

    it('accumulates result patches, later keys winning on conflict', () => {
        out.result = {};
        out.set({ a: 1, b: 2 });
        out.set({ b: 3 });

        expect(out.result).toEqual({ a: 1, b: 3 });
    });
});
