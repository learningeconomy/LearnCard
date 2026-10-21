import { describe, expect, it } from 'vitest';
import { validateScope, SCOPE_RESOURCES } from './token';
import { SEND_SH } from './generated/snippets';
import { withEnvTokenLoader } from './project';

describe('token scopes', () => {
    it('accepts real resource names and wildcards', () => {
        for (const resource of SCOPE_RESOURCES)
            expect(validateScope(`${resource}:write`)).toBe(`${resource}:write`);
        expect(validateScope('  boosts:write   inbox:read ')).toBe('boosts:write inbox:read');
        expect(validateScope('*:*')).toBe('*:*');
        expect(validateScope('')).toBe('');
    });
    it('rejects unknown resources, stale aliases, and malformed actions', () => {
        expect(() => validateScope('unicorns:write')).toThrow('Unknown scope resource');
        expect(() => validateScope('profile:write')).toThrow('profiles');
        expect(() => validateScope('boosts:admin')).toThrow('read, write, delete');
        expect(() => validateScope('boosts:write:extra')).toThrow();
    });
    it('writes send.sh that reads API_TOKEN from .env without executing it', () => {
        const written = withEnvTokenLoader(SEND_SH);
        expect(written).toContain("sed -n 's/^API_TOKEN=//p' .env");
        expect(written).not.toMatch(/tr -d/);
        expect(written).toContain('Bearer $TOKEN');
        expect(written).not.toContain('. .env');
        expect(written).not.toContain('source .env');
    });
});
