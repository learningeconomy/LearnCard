/**
 * Tests for the origin-resolution layer of @learncard/partner-connect.
 *
 * These tests run in jsdom and focus on three aspects:
 *   1. How `hostOrigin` entries are merged with the built-in tenant list.
 *   2. How the active host origin is selected from `ancestorOrigins` /
 *      `lc_host_override` / `sessionStorage` / configured fallbacks.
 *   3. How wildcard patterns behave both as whitelist entries and when
 *      rejecting untrusted event origins at runtime.
 */

import { PartnerConnect } from './index';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

interface WindowOverrides {
    search?: string;
    origin?: string;
    ancestors?: readonly string[] | null;
}

/**
 * Replace `window.location` and `window.location.ancestorOrigins` for a test.
 *
 * jsdom's `location` is read-only in recent versions, so we `defineProperty`
 * with a brand-new object that carries the pieces `configureActiveOrigin()`
 * actually reads.
 */
function installLocation(overrides: WindowOverrides): void {
    const {
        search = '',
        origin = 'https://partner-app.example.com',
        ancestors = null,
    } = overrides;

    const ancestorOrigins: DOMStringList | undefined =
        ancestors === null
            ? undefined
            : ({
                  length: ancestors.length,
                  item(index: number): string | null {
                      return ancestors[index] ?? null;
                  },
                  contains(value: string): boolean {
                      return ancestors.includes(value);
                  },
                  // Array index access used by `ancestorOrigins[0]`.
                  ...Object.fromEntries(ancestors.map((value, i) => [i, value])),
              } as unknown as DOMStringList);

    const stub: Partial<Location> & { ancestorOrigins?: DOMStringList } = {
        search,
        origin,
        href: `${origin}${search}`,
        hostname: new URL(origin).hostname,
        host: new URL(origin).host,
        protocol: new URL(origin).protocol,
        ancestorOrigins,
    };

    Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: stub as Location,
    });
}

function clearSessionStorage(): void {
    try {
        window.sessionStorage.clear();
    } catch {
        /* ignore */
    }
}

// Silence expected log output from the SDK in passing tests.
let consoleLogSpy: jest.SpyInstance;
let consoleWarnSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
    clearSessionStorage();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    installLocation({}); // reset for the next test
});

function getActiveOrigin(sdk: PartnerConnect): string {
    return (sdk as unknown as { activeHostOrigin: string }).activeHostOrigin;
}

function getHostOrigins(sdk: PartnerConnect): string[] {
    return (sdk as unknown as { hostOrigins: string[] }).hostOrigins;
}

function isValidOrigin(sdk: PartnerConnect, origin: string): boolean {
    const fn = (sdk as unknown as { isValidOrigin: (o: string) => boolean }).isValidOrigin;

    return fn.call(sdk, origin);
}

// ---------------------------------------------------------------------------
// DEFAULT_TRUSTED_TENANTS + disableDefaultTenants
// ---------------------------------------------------------------------------

describe('default tenant whitelist', () => {
    test('is merged into hostOrigins by default', () => {
        installLocation({});
        const sdk = new PartnerConnect({ hostOrigin: 'https://partner.example.com' });

        const whitelist = getHostOrigins(sdk);

        expect(whitelist[0]).toBe('https://partner.example.com');
        for (const entry of PartnerConnect.DEFAULT_TRUSTED_TENANTS) {
            expect(whitelist).toContain(entry);
        }

        sdk.destroy();
    });

    test('honors disableDefaultTenants: true', () => {
        installLocation({});
        const sdk = new PartnerConnect({
            hostOrigin: 'https://partner.example.com',
            disableDefaultTenants: true,
        });

        expect(getHostOrigins(sdk)).toEqual(['https://partner.example.com']);

        sdk.destroy();
    });

    test('lets a LearnCard tenant override activate via query param without any partner config', () => {
        installLocation({ search: '?lc_host_override=https://alpha.vetpass.app' });
        const sdk = new PartnerConnect(); // no hostOrigin at all

        expect(getActiveOrigin(sdk)).toBe('https://alpha.vetpass.app');

        sdk.destroy();
    });

    test('rejects an override outside both configured and default whitelists', () => {
        installLocation({ search: '?lc_host_override=https://evil.com' });
        const sdk = new PartnerConnect({ hostOrigin: 'https://partner.example.com' });

        expect(getActiveOrigin(sdk)).toBe('https://partner.example.com');
        expect(consoleWarnSpy).toHaveBeenCalled();

        sdk.destroy();
    });
});

// ---------------------------------------------------------------------------
// Wildcard pattern matching
// ---------------------------------------------------------------------------

describe('wildcard pattern matching in hostOrigin', () => {
    test.each([
        ['https://staging.learncard.app'],
        ['https://alpha.learncard.app'],
        ['https://pr-123.preview.learncard.app'],
    ])('accepts %s via https://*.learncard.app override', candidate => {
        installLocation({ search: `?lc_host_override=${encodeURIComponent(candidate)}` });
        const sdk = new PartnerConnect({
            hostOrigin: ['https://learncard.app', 'https://*.learncard.app'],
            disableDefaultTenants: true,
        });

        expect(getActiveOrigin(sdk)).toBe(candidate);

        sdk.destroy();
    });

    test.each([
        // Bare apex must not match `*.learncard.app` — caller must add the exact origin.
        ['https://learncard.app', 'https://*.learncard.app'],
        // Protocol mismatch.
        ['http://staging.learncard.app', 'https://*.learncard.app'],
        // Suffix confusion: the domain is the attacker's, not LearnCard's.
        ['https://learncard.app.attacker.com', 'https://*.learncard.app'],
        // Empty label where the wildcard should go.
        ['https://.learncard.app', 'https://*.learncard.app'],
    ])('rejects %s against %s', (candidate, pattern) => {
        installLocation({ search: `?lc_host_override=${encodeURIComponent(candidate)}` });
        const sdk = new PartnerConnect({
            hostOrigin: [pattern],
            disableDefaultTenants: true,
            // turn off native-app so localhost/capacitor don't accidentally rescue tests
            allowNativeAppOrigins: false,
        });

        expect(getActiveOrigin(sdk)).toBe(pattern);

        sdk.destroy();
    });

    test('exact-origin entries still match', () => {
        installLocation({ search: '?lc_host_override=https://learncard.app' });
        const sdk = new PartnerConnect({
            hostOrigin: 'https://learncard.app',
            disableDefaultTenants: true,
        });

        expect(getActiveOrigin(sdk)).toBe('https://learncard.app');

        sdk.destroy();
    });
});

// ---------------------------------------------------------------------------
// Priority: ancestorOrigins > lc_host_override > sessionStorage > fallback
// ---------------------------------------------------------------------------

describe('active-origin resolution hierarchy', () => {
    test('prefers ancestorOrigins[0] when it is in the whitelist', () => {
        installLocation({
            search: '?lc_host_override=https://learncard.app',
            ancestors: ['https://alpha.vetpass.app'],
        });

        const sdk = new PartnerConnect({ hostOrigin: 'https://learncard.app' });

        expect(getActiveOrigin(sdk)).toBe('https://alpha.vetpass.app');
        // Warn because override disagreed with real parent.
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining('lc_host_override does not match'),
            expect.any(Object)
        );

        sdk.destroy();
    });

    test('ignores ancestorOrigins[0] when it is NOT in the whitelist', () => {
        installLocation({
            search: '?lc_host_override=https://learncard.app',
            ancestors: ['https://evil.com'],
        });

        const sdk = new PartnerConnect({
            hostOrigin: 'https://learncard.app',
            disableDefaultTenants: true,
        });

        // Since the ancestor isn't trusted, we fall through to the override.
        expect(getActiveOrigin(sdk)).toBe('https://learncard.app');

        sdk.destroy();
    });

    test('falls back to lc_host_override when ancestorOrigins is unavailable', () => {
        installLocation({
            search: '?lc_host_override=https://staging.learncard.app',
            ancestors: null, // Firefox / top-level context
        });

        const sdk = new PartnerConnect({
            hostOrigin: ['https://learncard.app', 'https://*.learncard.app'],
            disableDefaultTenants: true,
        });

        expect(getActiveOrigin(sdk)).toBe('https://staging.learncard.app');

        sdk.destroy();
    });

    test('falls back to sessionStorage when no query param is present', () => {
        window.sessionStorage.setItem('lc_host_override', 'https://staging.learncard.app');

        installLocation({ search: '' });

        const sdk = new PartnerConnect({
            hostOrigin: ['https://learncard.app', 'https://*.learncard.app'],
            disableDefaultTenants: true,
        });

        expect(getActiveOrigin(sdk)).toBe('https://staging.learncard.app');

        sdk.destroy();
    });

    test('falls back to the first configured origin when everything else is absent', () => {
        installLocation({});
        const sdk = new PartnerConnect({
            hostOrigin: ['https://partner.example.com'],
            disableDefaultTenants: true,
        });

        expect(getActiveOrigin(sdk)).toBe('https://partner.example.com');

        sdk.destroy();
    });

    test('persists a valid override back into sessionStorage', () => {
        installLocation({ search: '?lc_host_override=https://staging.learncard.app' });

        const sdk = new PartnerConnect({
            hostOrigin: ['https://learncard.app', 'https://*.learncard.app'],
            disableDefaultTenants: true,
        });

        expect(window.sessionStorage.getItem('lc_host_override')).toBe(
            'https://staging.learncard.app'
        );

        sdk.destroy();
    });
});

// ---------------------------------------------------------------------------
// Runtime message validation
// ---------------------------------------------------------------------------

describe('incoming message validation', () => {
    test('accepts messages from the active host origin and rejects everything else', () => {
        installLocation({
            search: '?lc_host_override=https://alpha.vetpass.app',
        });
        const sdk = new PartnerConnect({
            hostOrigin: ['https://learncard.app', 'https://*.vetpass.app'],
            disableDefaultTenants: true,
        });

        expect(getActiveOrigin(sdk)).toBe('https://alpha.vetpass.app');
        expect(isValidOrigin(sdk, 'https://alpha.vetpass.app')).toBe(true);

        // Other whitelisted origins must still be rejected — only the single
        // active origin is trusted for event validation.
        expect(isValidOrigin(sdk, 'https://learncard.app')).toBe(false);
        expect(isValidOrigin(sdk, 'https://vetpass.app')).toBe(false);
        expect(isValidOrigin(sdk, 'https://evil.com')).toBe(false);

        sdk.destroy();
    });
});

// ---------------------------------------------------------------------------
// Native-app origins
// ---------------------------------------------------------------------------

describe('native-app origins', () => {
    test('are accepted by default without being in hostOrigin', () => {
        installLocation({ search: '?lc_host_override=capacitor://localhost' });
        const sdk = new PartnerConnect({
            hostOrigin: 'https://learncard.app',
            disableDefaultTenants: true,
        });

        expect(getActiveOrigin(sdk)).toBe('capacitor://localhost');

        sdk.destroy();
    });

    test('can be disabled via allowNativeAppOrigins: false', () => {
        installLocation({ search: '?lc_host_override=capacitor://localhost' });
        const sdk = new PartnerConnect({
            hostOrigin: 'https://learncard.app',
            disableDefaultTenants: true,
            allowNativeAppOrigins: false,
        });

        expect(getActiveOrigin(sdk)).toBe('https://learncard.app');

        sdk.destroy();
    });
});
