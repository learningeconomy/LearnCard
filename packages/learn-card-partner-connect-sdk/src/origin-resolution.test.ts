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
    const { search = '', origin = 'https://partner-app.example.com', ancestors = null } = overrides;

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
// Publish-origin resolution (lc_publish_override)
// ---------------------------------------------------------------------------

describe('publish-origin resolution hierarchy', () => {
    const mocked = { mock: true as const, mockOptions: { ui: false, log: false } };

    test('mockOptions.publishOrigin outranks lc_publish_override', () => {
        installLocation({ search: '?lc_publish_override=https://staging.learncard.app' });

        const sdk = new PartnerConnect({
            mock: true,
            mockOptions: { ui: false, log: false, publishOrigin: 'https://explicit.learncard.app' },
        });

        expect(sdk.getPublishOrigin()).toBe('https://explicit.learncard.app');

        sdk.destroy();
    });

    test('lc_publish_override outranks lc_host_override', () => {
        installLocation({
            search: '?lc_host_override=https://alpha.vetpass.app&lc_publish_override=http://localhost:3000',
        });

        const sdk = new PartnerConnect(mocked);

        expect(sdk.getPublishOrigin()).toBe('http://localhost:3000');

        sdk.destroy();
    });

    test('a stored lc_publish_override still outranks an lc_host_override param', () => {
        window.sessionStorage.setItem('lc_publish_override', 'http://localhost:3000');
        installLocation({ search: '?lc_host_override=https://alpha.vetpass.app' });

        const sdk = new PartnerConnect(mocked);

        expect(sdk.getPublishOrigin()).toBe('http://localhost:3000');

        sdk.destroy();
    });

    test('falls back to a concrete lc_host_override when no publish override exists', () => {
        installLocation({ search: '?lc_host_override=https://alpha.vetpass.app' });

        const sdk = new PartnerConnect(mocked);

        expect(sdk.getPublishOrigin()).toBe('https://alpha.vetpass.app');

        sdk.destroy();
    });

    test('uses a stored lc_host_override when no query params are present', () => {
        window.sessionStorage.setItem('lc_host_override', 'https://alpha.vetpass.app');
        installLocation({ search: '' });

        const sdk = new PartnerConnect(mocked);

        expect(sdk.getPublishOrigin()).toBe('https://alpha.vetpass.app');

        sdk.destroy();
    });

    test('ignores a wildcard lc_host_override and infers from configured origins', () => {
        installLocation({ search: '?lc_host_override=https://*.learncard.app' });

        const sdk = new PartnerConnect({
            ...mocked,
            hostOrigin: 'https://staging.learncard.app',
            disableDefaultTenants: true,
        });

        expect(sdk.getPublishOrigin()).toBe('https://staging.learncard.app');

        sdk.destroy();
    });

    test('infers the first concrete configured origin, skipping wildcards', () => {
        installLocation({ search: '' });

        const sdk = new PartnerConnect({
            ...mocked,
            hostOrigin: ['https://*.learncard.app', 'https://staging.learncard.app'],
            disableDefaultTenants: true,
        });

        expect(sdk.getPublishOrigin()).toBe('https://staging.learncard.app');

        sdk.destroy();
    });

    test('falls back to the default publish origin when nothing else applies', () => {
        installLocation({ search: '' });

        const sdk = new PartnerConnect(mocked);

        expect(sdk.getPublishOrigin()).toBe('https://learncard.app');

        sdk.destroy();
    });

    test('applies to non-mock instances too', () => {
        installLocation({ search: '?lc_publish_override=http://localhost:3000' });

        const sdk = new PartnerConnect({ mock: false });

        expect(sdk.getPublishOrigin()).toBe('http://localhost:3000');

        sdk.destroy();
    });

    test('normalizes a full URL down to its origin', () => {
        installLocation({
            search: `?lc_publish_override=${encodeURIComponent(
                'http://localhost:3000/app-store/developer?foo=bar'
            )}`,
        });

        const sdk = new PartnerConnect(mocked);

        expect(sdk.getPublishOrigin()).toBe('http://localhost:3000');

        sdk.destroy();
    });
});

describe('invalid lc_publish_override values', () => {
    const mocked = { mock: true as const, mockOptions: { ui: false, log: false } };

    test.each([['not-a-url'], ['ftp://example.com'], ['//learncard.app'], ['javascript:alert(1)']])(
        'ignores %s with a warning and falls through',
        value => {
            installLocation({ search: `?lc_publish_override=${encodeURIComponent(value)}` });

            const sdk = new PartnerConnect({
                ...mocked,
                hostOrigin: 'https://staging.learncard.app',
                disableDefaultTenants: true,
            });

            expect(sdk.getPublishOrigin()).toBe('https://staging.learncard.app');
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('lc_publish_override is not a valid http(s) origin'),
                value
            );

            sdk.destroy();
        }
    );

    test('an invalid value still lets a concrete lc_host_override through', () => {
        installLocation({
            search: '?lc_publish_override=nope&lc_host_override=https://alpha.vetpass.app',
        });

        const sdk = new PartnerConnect(mocked);

        expect(sdk.getPublishOrigin()).toBe('https://alpha.vetpass.app');

        sdk.destroy();
    });

    test('a corrupt stored value is ignored rather than thrown on', () => {
        window.sessionStorage.setItem('lc_publish_override', 'not-a-url');
        installLocation({ search: '' });

        const sdk = new PartnerConnect(mocked);

        expect(sdk.getPublishOrigin()).toBe('https://learncard.app');

        sdk.destroy();
    });
});

describe('lc_publish_override sessionStorage persistence', () => {
    const mocked = { mock: true as const, mockOptions: { ui: false, log: false } };

    test('persists a valid override so later navigations keep it', () => {
        installLocation({ search: '?lc_publish_override=http://localhost:3000' });

        const first = new PartnerConnect(mocked);
        expect(window.sessionStorage.getItem('lc_publish_override')).toBe('http://localhost:3000');
        first.destroy();

        // A later page load in the same tab, without the query parameter.
        installLocation({ search: '' });

        const second = new PartnerConnect(mocked);
        expect(second.getPublishOrigin()).toBe('http://localhost:3000');
        second.destroy();
    });

    test('persists the normalized origin, not the raw value', () => {
        installLocation({
            search: `?lc_publish_override=${encodeURIComponent('http://localhost:3000/submit')}`,
        });

        const sdk = new PartnerConnect(mocked);

        expect(window.sessionStorage.getItem('lc_publish_override')).toBe('http://localhost:3000');

        sdk.destroy();
    });

    test('does not persist an invalid value', () => {
        installLocation({ search: '?lc_publish_override=not-a-url' });

        const sdk = new PartnerConnect(mocked);

        expect(window.sessionStorage.getItem('lc_publish_override')).toBeNull();

        sdk.destroy();
    });

    test('is stored separately from lc_host_override', () => {
        installLocation({
            search: '?lc_host_override=https://alpha.vetpass.app&lc_publish_override=http://localhost:3000',
        });

        const sdk = new PartnerConnect(mocked);

        expect(window.sessionStorage.getItem('lc_host_override')).toBe('https://alpha.vetpass.app');
        expect(window.sessionStorage.getItem('lc_publish_override')).toBe('http://localhost:3000');

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
