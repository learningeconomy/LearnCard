import { beforeEach, describe, expect, it } from 'vitest';

import { displayHost, isValidTestAddress, readTestAddress, writeTestAddress } from './testAddress';

describe('test address', () => {
    beforeEach(() => localStorage.clear());

    it('is remembered per app', () => {
        writeTestAddress('a', { address: 'http://localhost:5173', enabled: true });

        expect(readTestAddress('a')).toEqual({ address: 'http://localhost:5173', enabled: true });
        expect(readTestAddress('b')).toEqual({ address: '', enabled: false });
    });

    it('accepts local and preview addresses but not junk', () => {
        expect(isValidTestAddress('http://localhost:5173')).toBe(true);
        expect(isValidTestAddress('https://id-preview--abc.lovable.app')).toBe(true);
        expect(isValidTestAddress('localhost')).toBe(false);
        expect(isValidTestAddress('javascript:alert(1)')).toBe(false);
    });

    it('shows just the host', () => {
        expect(displayHost('http://localhost:5173/path')).toBe('localhost:5173');
    });
});
