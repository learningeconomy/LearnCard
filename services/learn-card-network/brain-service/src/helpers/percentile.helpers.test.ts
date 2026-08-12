import { describe, it, expect } from 'vitest';
import { percentile, summarize } from './percentile.helpers';

describe('percentile', () => {
    it('returns 0 for an empty array', () => {
        expect(percentile([], 50)).toBe(0);
    });

    it('returns the only element when array has length 1', () => {
        expect(percentile([42], 50)).toBe(42);
        expect(percentile([42], 95)).toBe(42);
    });

    it('computes p50 of a sorted array', () => {
        expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 50)).toBe(5);
    });

    it('computes p95 of a sorted array', () => {
        const arr = Array.from({ length: 20 }, (_, i) => i + 1);
        expect(percentile(arr, 95)).toBe(19);
    });

    it('handles unsorted input', () => {
        expect(percentile([10, 1, 5, 3, 7, 9, 2, 8, 4, 6], 50)).toBe(5);
    });
});

describe('summarize', () => {
    it('returns p50/p95/p99 for an array of numbers', () => {
        const arr = Array.from({ length: 100 }, (_, i) => i + 1);
        const s = summarize(arr);
        expect(s.p50).toBe(50);
        expect(s.p95).toBe(95);
        expect(s.p99).toBe(99);
    });

    it('returns zeros for an empty array', () => {
        expect(summarize([])).toEqual({ p50: 0, p95: 0, p99: 0 });
    });
});
