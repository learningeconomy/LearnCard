// @vitest-environment jsdom
import { vi } from 'vitest';

/**
 * Tests for standalone mock mode and embed detection in
 * @learncard/partner-connect. These run in jsdom, where `window.self` equals
 * `window.top` (i.e. not embedded), so 'auto' mock mode is active by default.
 */

import type { MockInstance } from 'vitest';

import {
    PartnerConnect,
    PartnerConnectError,
    createPartnerConnect,
    decodeManifestFromUrl,
    isEmbedded,
    previewCompiledTemplate,
} from './index';
import type { CapturedAppManifest, ConsentRequest } from './types';

const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

describe('practice identity, reset and icons', () => {
    const namespace = 'practice-features';
    const clients: PartnerConnect[] = [];
    const create = (appId?: string, ui = false): PartnerConnect => {
        const client = createPartnerConnect({
            mock: true,
            mockOptions: { namespace, appId, ui, log: false },
        });
        clients.push(client);
        return client;
    };
    let title: string;
    beforeEach(() => {
        title = document.title;
    });
    afterEach(() => {
        clients.splice(0).forEach(client => client.destroy());
        document.title = title;
        document.querySelectorAll('[data-test-icon]').forEach(node => node.remove());
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });
    const icon = (rel: string, href: string, sizes = ''): void => {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        link.setAttribute('sizes', sizes);
        link.setAttribute('data-test-icon', '');
        document.head.appendChild(link);
    };

    it('persists generated keys per title and uses explicit app IDs exactly', async () => {
        document.title = 'First practice app';
        const first = create();
        await first.requestIdentity();
        const key = first.getCapturedManifest()?.appKey;
        expect(key).toBeTruthy();
        expect(create().getCapturedManifest()?.appKey).toBe(key);
        document.title = 'Second practice app';
        const second = create();
        await second.requestIdentity();
        expect(second.getCapturedManifest()?.appKey).not.toBe(key);
        const explicit = create('My Exact ID');
        await explicit.requestIdentity();
        expect(explicit.getCapturedManifest()?.appKey).toBe('My Exact ID');
    });

    it('resets only the current app and generates a fresh key on next capture', async () => {
        document.title = 'Reset app';
        const first = create();
        await first.incrementCounter('points', 4);
        const key = first.getCapturedManifest()?.appKey;
        const second = create('other');
        await second.incrementCounter('points', 9);
        first.resetPracticeMode();
        expect(first.getCapturedManifest()).toBeUndefined();
        expect((await first.getCounter('points')).value).toBe(0);
        expect(first.getCapturedManifest()?.appKey).not.toBe(key);
        expect((await second.getCounter('points')).value).toBe(9);
        expect(second.getCapturedManifest()?.appKey).toBe('other');
        expect(() => createPartnerConnect({ mock: false }).resetPracticeMode()).not.toThrow();
    });

    it('confirms in place, focuses Cancel, supports cancellation and clears the HUD', async () => {
        const client = create('reset-ui', true);
        await client.requestIdentity();
        const click = (selector: string): void => {
            document.querySelector<HTMLButtonElement>(selector)!.click();
        };
        click('.lc-mock-hud-pill');
        click('.lc-mock-hud-reset');
        expect(document.activeElement?.textContent).toBe('Cancel');
        expect(document.querySelector('.lc-mock-hud')?.textContent).toContain(
            'Start over with this app?'
        );
        click('.lc-mock-hud-reset-cancel');
        expect(document.querySelector('.lc-mock-hud-reset')).not.toBeNull();
        click('.lc-mock-hud-reset');
        document.activeElement?.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        );
        expect(document.querySelector('.lc-mock-hud-reset')).not.toBeNull();
        click('.lc-mock-hud-reset');
        click('.lc-mock-hud-reset-confirm');
        expect(client.getCapturedManifest()).toBeUndefined();
        expect(document.querySelector<HTMLElement>('.lc-mock-hud')?.style.display).toBe('none');
    });

    it('ranks Apple icons above large icons, ignores masks, and falls back to favicon', async () => {
        icon('icon', '/small.png', '16x16');
        icon('shortcut icon', '/large.png', '256x256');
        icon('mask-icon', '/mask.svg', 'any');
        icon('apple-touch-icon-precomposed', '/apple.png', '32x32');
        const apple = create('apple');
        await apple.requestIdentity();
        expect(apple.getCapturedManifest()?.suggestedIconUrl).toBe(
            new URL('/apple.png', location.href).href
        );
        document.querySelector('[rel="apple-touch-icon-precomposed"]')?.remove();
        const large = create('large');
        await large.requestIdentity();
        expect(large.getCapturedManifest()?.suggestedIconUrl).toBe(
            new URL('/large.png', location.href).href
        );
        document.querySelectorAll('[data-test-icon]').forEach(node => node.remove());
        const fallback = create('fallback');
        await fallback.requestIdentity();
        expect(fallback.getCapturedManifest()?.suggestedIconUrl).toBeUndefined();
    });

    it('only keeps the guessed /favicon.ico when it actually loads', async () => {
        vi.useFakeTimers();
        const stubImage = (outcome: 'load' | 'error') =>
            vi.stubGlobal(
                'Image',
                class {
                    naturalWidth = 32;
                    naturalHeight = 32;
                    crossOrigin = '';
                    onload: (() => void) | null = null;
                    onerror: (() => void) | null = null;
                    removeAttribute(): void {}
                    set src(_value: string) {
                        setTimeout(() => (outcome === 'load' ? this.onload : this.onerror)?.(), 0);
                    }
                }
            );

        stubImage('error');
        const missing = create('favicon-missing');
        await missing.requestIdentity();
        await vi.advanceTimersByTimeAsync(10);
        expect(missing.getCapturedManifest()?.suggestedIconUrl).toBeUndefined();

        stubImage('load');
        const present = create('favicon-present');
        await present.requestIdentity();
        await vi.advanceTimersByTimeAsync(10);
        expect(present.getCapturedManifest()?.suggestedIconUrl).toBe(
            new URL('/favicon.ico', location.href).href
        );
    });

    it('rasterizes an icon and prefers the captured data in the avatar', async () => {
        const data = 'data:image/webp;base64,aGVsbG8=';
        vi.stubGlobal(
            'Image',
            class {
                naturalWidth = 256;
                naturalHeight = 128;
                onload: (() => void) | null = null;
                onerror: (() => void) | null = null;
                set src(_value: string) {
                    queueMicrotask(() => this.onload?.());
                }
                removeAttribute(): void {}
            }
        );
        const drawImage = vi.fn();
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            drawImage,
        } as unknown as CanvasRenderingContext2D);
        vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(data);
        const client = create('raster', true);
        await client.requestIdentity();
        await flush();
        expect(client.getCapturedManifest()?.suggestedIconDataUrl).toBe(data);
        expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 32, 128, 64);
        document.querySelector<HTMLButtonElement>('.lc-mock-hud-pill')!.click();
        expect(document.querySelector<HTMLImageElement>('.lc-mock-hud-avatar img')?.src).toBe(data);
    });

    it('drops oversized image data from publish links without changing stored captures', async () => {
        const client = create('long-url');
        await client.requestIdentity();
        const manifests = readManifestMap(namespace);
        manifests['long-url'].suggestedIconDataUrl = `data:image/png;base64,${'x'.repeat(8000)}`;
        localStorage.setItem(`${namespace}:manifests`, JSON.stringify(manifests));
        const url = client.getPublishUrl()!;
        expect(url.length).toBeLessThan(7000);
        expect(
            decodeManifestFromUrl(new URL(url).searchParams.get('manifest')!)?.suggestedIconDataUrl
        ).toBeUndefined();
        expect(client.getCapturedManifest()?.suggestedIconDataUrl).toBeTruthy();
    });

    it('clears practice credentials, template versions and publish dismissal', async () => {
        const client = create('reset-records');
        const template = { name: 'First badge' };
        await client.sendCredential({ alias: 'badge', template });
        await client.sendCredential({ alias: 'badge', template: { name: 'Updated badge' } });
        localStorage.setItem(
            `${namespace}:publish-dismissed-at:reset-records`,
            new Date().toISOString()
        );
        client.resetPracticeMode();
        expect(localStorage.getItem(`${namespace}:publish-dismissed-at:reset-records`)).toBeNull();
        expect(
            (await client.checkUserHasCredential({ templateAlias: 'badge' })).hasCredential
        ).toBe(false);
        expect((await client.sendCredential({ alias: 'badge', template })).templateVersion).toBe(1);
    });

    it('falls back to session identity and resets when storage throws', async () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        const client = create();
        await client.requestIdentity();
        const key = client.getCapturedManifest()?.appKey;
        await client.requestIdentity();
        expect(client.getCapturedManifest()?.appKey).toBe(key);
        client.resetPracticeMode();
        expect(client.getCapturedManifest()).toBeUndefined();
        await client.requestIdentity();
        expect(client.getCapturedManifest()?.appKey).not.toBe(key);
    });

    it('reads the largest same-origin manifest icon and cancels pending image work on destroy', async () => {
        vi.useFakeTimers();
        icon('manifest', '/app.webmanifest');
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                icons: [
                    { src: '/tiny.png', sizes: '16x16' },
                    { src: '/big.png', sizes: '512x512' },
                ],
            }),
        });
        vi.stubGlobal('fetch', fetchMock);
        const client = create('manifest-icon');
        await client.requestIdentity();
        await vi.advanceTimersByTimeAsync(4001);
        expect(client.getCapturedManifest()?.suggestedIconUrl).toBe(
            new URL('/big.png', location.href).href
        );
        expect(client.getCapturedManifest()?.suggestedIconDataUrl).toBeUndefined();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await client.requestIdentity();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        client.destroy();
        await vi.advanceTimersByTimeAsync(50);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('aborts a pending manifest fetch without recreating a reset capture', async () => {
        vi.useFakeTimers();
        icon('manifest', '/pending.webmanifest');
        vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => undefined)));
        const client = create('pending-icon');
        await client.requestIdentity();
        client.resetPracticeMode();
        await vi.advanceTimersByTimeAsync(5000);
        expect(client.getCapturedManifest()).toBeUndefined();
        client.destroy();
        expect(vi.getTimerCount()).toBe(0);
    });
});

const readManifestMap = (namespace: string): Record<string, CapturedAppManifest> => {
    const raw = localStorage.getItem(`${namespace}:manifests`);
    return raw ? (JSON.parse(raw) as Record<string, CapturedAppManifest>) : {};
};

let errorSpy: MockInstance;

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
        localStorage.clear();
        // Tests that install a trusted `ancestorOrigins` persist an
        // `lc_host_override`, which would otherwise leak into later cases.
        sessionStorage.clear();
    } catch {
        // localStorage may be unavailable in some environments.
    }
});

afterEach(() => {
    vi.restoreAllMocks();
    document
        .querySelectorAll('.lc-mock-toast, .lc-mock-stack, .lc-mock-hud')
        .forEach(node => node.remove());
});

describe('isEmbedded', () => {
    it('returns false at the top level (jsdom is not embedded)', () => {
        expect(isEmbedded()).toBe(false);
        expect(PartnerConnect.isEmbedded()).toBe(false);
        expect(createPartnerConnect().isEmbedded()).toBe(false);
    });

    it('returns true when window.self differs from window.top', () => {
        const originalTop = Object.getOwnPropertyDescriptor(window, 'top');
        Object.defineProperty(window, 'top', {
            configurable: true,
            get: () => ({}) as Window,
        });

        try {
            expect(isEmbedded()).toBe(true);
        } finally {
            if (originalTop) Object.defineProperty(window, 'top', originalTop);
        }
    });
});

describe('standalone with no host (not embedded, not mocking)', () => {
    it('fails fast with LC_NOT_EMBEDDED instead of timing out', async () => {
        const lc = createPartnerConnect({ mock: false });
        await expect(lc.requestIdentity()).rejects.toMatchObject({ code: 'LC_NOT_EMBEDDED' });
    });

    it('logs an actionable breadcrumb once, not per call', async () => {
        const lc = createPartnerConnect({ mock: false });
        await lc.requestIdentity().catch(() => undefined);
        await lc.getSyncStatus().catch(() => undefined);
        await lc.incrementCounter('coins', 1).catch(() => undefined);
        expect(errorSpy).toHaveBeenCalledTimes(1);
    });
});

describe('mock mode activation', () => {
    it('auto-activates when not embedded', () => {
        expect(createPartnerConnect().isMocked()).toBe(true);
    });

    it('can be forced off', () => {
        expect(createPartnerConnect({ mock: false }).isMocked()).toBe(false);
    });

    it('can be forced on', () => {
        expect(createPartnerConnect({ mock: true }).isMocked()).toBe(true);
    });

    it('reports active host and publish origins across mock and real modes', () => {
        const mocked = createPartnerConnect({ mock: true, mockOptions: { ui: false } });
        expect(mocked.getActiveHostOrigin()).toBeNull();
        expect(mocked.getPublishOrigin()).toBe('https://learncard.app');

        const real = createPartnerConnect({
            mock: false,
            hostOrigin: 'https://staging.learncard.app',
        });
        expect(real.getActiveHostOrigin()).toBe('https://staging.learncard.app');
        expect(real.getPublishOrigin()).toBe('https://staging.learncard.app');
    });

    it('does NOT auto-mock on non-local standalone hosts (deploy previews, production)', async () => {
        const original = Object.getOwnPropertyDescriptor(window, 'location');
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                hostname: 'my-app.netlify.app',
                search: '',
                href: 'https://my-app.netlify.app/',
            },
        });

        try {
            const lc = createPartnerConnect();
            expect(lc.isMocked()).toBe(false);
            await expect(lc.requestIdentity()).rejects.toMatchObject({
                code: 'LC_NOT_EMBEDDED',
            });

            expect(createPartnerConnect({ mock: true }).isMocked()).toBe(true);
            expect(createPartnerConnect({ mock: 'standalone' }).isMocked()).toBe(true);
        } finally {
            if (original) Object.defineProperty(window, 'location', original);
        }
    });

    it('auto-mocks on *.local and *.localhost dev hosts', () => {
        const original = Object.getOwnPropertyDescriptor(window, 'location');

        for (const hostname of ['myapp.local', 'myapp.localhost']) {
            Object.defineProperty(window, 'location', {
                configurable: true,
                value: { hostname, search: '', href: `http://${hostname}/` },
            });

            try {
                expect(createPartnerConnect().isMocked()).toBe(true);
            } finally {
                if (original) Object.defineProperty(window, 'location', original);
            }
        }
    });

    it('auto-mocks on app-builder preview hosts but never on their published hosts', () => {
        const original = Object.getOwnPropertyDescriptor(window, 'location');
        const cases: Array<[string, boolean]> = [
            ['abc123.lovableproject.com', true],
            ['id-preview--0f3c.lovable.app', true],
            ['8f2c.picard.replit.dev', true],
            ['my-app.lovable.app', false],
            ['my-app.replit.app', false],
            ['my-app.vercel.app', false],
        ];

        for (const [hostname, mocked] of cases) {
            Object.defineProperty(window, 'location', {
                configurable: true,
                value: { hostname, search: '', href: `https://${hostname}/` },
            });

            try {
                expect({ hostname, mocked: createPartnerConnect().isMocked() }).toEqual({
                    hostname,
                    mocked,
                });
            } finally {
                if (original) Object.defineProperty(window, 'location', original);
            }
        }
    });
});

describe('embedded parent classification', () => {
    let originalTop: PropertyDescriptor | undefined;
    let originalLocation: PropertyDescriptor | undefined;

    const embedIn = (ancestorOrigin: string | null, hostname = 'localhost'): void => {
        Object.defineProperty(window, 'top', {
            configurable: true,
            get: () => ({}) as Window,
        });
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                hostname,
                search: '',
                href: `http://${hostname}/`,
                ...(ancestorOrigin ? { ancestorOrigins: [ancestorOrigin] } : {}),
            },
        });
    };

    beforeEach(() => {
        originalTop = Object.getOwnPropertyDescriptor(window, 'top');
        originalLocation = Object.getOwnPropertyDescriptor(window, 'location');
    });

    afterEach(() => {
        if (originalTop) Object.defineProperty(window, 'top', originalTop);
        if (originalLocation) Object.defineProperty(window, 'location', originalLocation);
    });

    it('never mocks when the parent is a configured LearnCard origin', () => {
        embedIn('https://learncard.app');
        expect(createPartnerConnect().isMocked()).toBe(false);
    });

    it('auto-mocks immediately inside a foreign (non-LearnCard) iframe on a local dev host', () => {
        embedIn('https://storybook.example.com');
        expect(createPartnerConnect().isMocked()).toBe(true);
    });

    it('fails fast instead of hanging inside a foreign iframe when mocking is off', async () => {
        embedIn('https://storybook.example.com');
        const lc = createPartnerConnect({ mock: false });
        await expect(lc.requestIdentity()).rejects.toMatchObject({ code: 'LC_NOT_EMBEDDED' });
    });

    it('probes an ambiguous localhost parent and mocks when nothing answers', async () => {
        embedIn('http://localhost:6006');
        const lc = createPartnerConnect({ hostProbeTimeout: 40 });
        expect(lc.isMocked()).toBe(false);

        const identity = await lc.requestIdentity();
        expect(lc.isMocked()).toBe(true);
        expect(identity.user.did).toBeDefined();
    });

    it("mock: 'standalone' mocks inside a foreign iframe even on a non-local host", () => {
        embedIn('https://preview-shell.example.com', 'my-app.lovable.app');
        expect(createPartnerConnect({ mock: 'standalone' }).isMocked()).toBe(true);
    });

    it("mock: 'standalone' uses the real host when embedded in a LearnCard origin", () => {
        embedIn('https://learncard.app', 'my-app.lovable.app');
        expect(createPartnerConnect({ mock: 'standalone' }).isMocked()).toBe(false);
    });

    it("mock: 'standalone' probes an ambiguous parent on non-local hosts and mocks when unanswered", async () => {
        embedIn('http://localhost:6006', 'my-app.lovable.app');
        const lc = createPartnerConnect({ mock: 'standalone', hostProbeTimeout: 40 });

        const identity = await lc.requestIdentity();
        expect(lc.isMocked()).toBe(true);
        expect(identity.user.did).toBeDefined();
    });

    it('auto-mocks inside an app-builder editor frame on a non-local host', () => {
        embedIn('https://lovable.dev', 'my-app.lovable.app');
        expect(createPartnerConnect().isMocked()).toBe(true);
    });

    it('auto-mocks inside an app-builder editor when the browser hides ancestor origins', async () => {
        embedIn(null, 'my-app.lovable.app');
        const originalReferrer = Object.getOwnPropertyDescriptor(document, 'referrer');
        Object.defineProperty(document, 'referrer', {
            configurable: true,
            get: () => 'https://lovable.dev/projects/abc',
        });

        try {
            const lc = createPartnerConnect({ hostProbeTimeout: 40 });
            await lc.requestIdentity();
            expect(lc.isMocked()).toBe(true);
        } finally {
            if (originalReferrer) Object.defineProperty(document, 'referrer', originalReferrer);
            else delete (document as { referrer?: string }).referrer;
        }
    });

    it('does not auto-mock a published app inside an unrelated frame', async () => {
        embedIn('https://preview-shell.example.com', 'my-app.lovable.app');
        const lc = createPartnerConnect();
        expect(lc.isMocked()).toBe(false);
        await expect(lc.requestIdentity()).rejects.toMatchObject({ code: 'LC_NOT_EMBEDDED' });
    });

    it('uses the real host when a preview-host app is embedded in LearnCard', () => {
        embedIn('https://learncard.app', 'abc123.lovableproject.com');
        expect(createPartnerConnect().isMocked()).toBe(false);
    });

    it('stays in real-host mode when the probe is answered', async () => {
        embedIn('http://localhost');

        const answerProbe = (event: MessageEvent): void => {
            const data = event.data as { action?: string; requestId?: string; protocol?: string };
            if (data?.action !== 'GET_SYNC_STATUS' || !data.requestId) return;
            window.postMessage(
                {
                    protocol: data.protocol,
                    requestId: data.requestId,
                    type: 'SUCCESS',
                    data: { status: 'ready' },
                },
                'http://localhost'
            );
        };
        window.addEventListener('message', answerProbe);

        try {
            const lc = createPartnerConnect({ hostProbeTimeout: 500 });
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(lc.isMocked()).toBe(false);
        } finally {
            window.removeEventListener('message', answerProbe);
        }
    });
});

describe('mock responses', () => {
    it('resolves requestIdentity with the configured fake DID', async () => {
        const lc = createPartnerConnect({ mockOptions: { did: 'did:web:test:me', ui: false } });
        const identity = await lc.requestIdentity();
        expect(identity.token).toContain('mock-token');
        expect(identity.user.did).toBe('did:web:test:me');
    });

    it('resolves raw sendCredential with a mock credential id', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });
        const res = (await lc.sendCredential({
            credentialSubject: { achievement: { name: 'Course Completion' } },
        })) as { credentialId: string };
        expect(res.credentialId).toContain('mock-credential');
    });

    it('resolves template sendCredential with mock URIs', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });
        const res = (await lc.sendCredential({ templateAlias: 'course-completion' })) as {
            credentialUri: string;
            boostUri: string;
        };
        expect(res.credentialUri).toContain('lc:mock:credential');
        expect(res.boostUri).toContain('course-completion');
    });

    it('auto-grants requestConsent', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });
        await expect(lc.requestConsent('lc:contract:abc')).resolves.toEqual({ granted: true });
    });

    it('auto-grants declarative requestConsent and summarizes scopes in the toast', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: true } });

        await expect(
            lc.requestConsent({
                read: {
                    credentialCategories: ['Achievement', 'Skill'],
                    personalFields: ['name'],
                },
            })
        ).resolves.toEqual({ granted: true });

        await flush();
        expect(document.body.textContent).toContain('Achievement, Skill');
        expect(document.body.textContent).toContain('name');
    });

    it('reports a ready sync status so onSyncComplete resolves', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });
        await expect(lc.getSyncStatus()).resolves.toMatchObject({ status: 'ready' });
    });

    it('validates inline credential templates offline', () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });

        expect(
            lc.validateCredentialTemplate(
                {
                    name: 'Completed {{courseName}}',
                    description: 'Awarded for finishing {{courseName}}.',
                    achievementType: 'Course',
                    criteria: { narrative: 'Finished all modules' },
                },
                { courseName: 'Intro to Baking' }
            )
        ).toEqual({ valid: true, errors: [] });

        const invalid = lc.validateCredentialTemplate(
            {
                name: 'Completed {{courseName}}',
                description: 'Awarded for finishing {{courseName}}.',
            },
            { wrongKey: 'Intro to Baking' }
        );

        expect(invalid.valid).toBe(false);
        expect(invalid.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: 'templateData.courseName' }),
                expect.objectContaining({ path: 'templateData.wrongKey' }),
            ])
        );
    });

    it('previews compiled templates offline via the instance method', () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });

        const preview = lc.previewCompiledTemplate(
            {
                name: 'Completed {{courseName}}',
                description: 'Awarded for finishing {{courseName}}.',
                credits: { earned: '{{earnedCredits}}' },
            },
            { courseName: 'Intro to Baking', earnedCredits: 3 }
        );

        expect(preview).toMatchObject({ valid: true, errors: [] });
        expect(preview.compiled).toMatchObject({
            name: 'Completed {{courseName}}',
            credentialSubject: expect.objectContaining({
                achievement: expect.objectContaining({ name: 'Completed {{courseName}}' }),
                creditsEarned: '{{earnedCredits}}',
            }),
        });
        expect(preview.rendered).toMatchObject({
            name: 'Completed Intro to Baking',
            credentialSubject: expect.objectContaining({
                achievement: expect.objectContaining({ name: 'Completed Intro to Baking' }),
                creditsEarned: 3,
            }),
        });
    });

    it('previews compiled templates offline via the standalone export and returns data errors', () => {
        const invalidTemplate = previewCompiledTemplate({ description: 'Missing name' } as never);
        expect(invalidTemplate.valid).toBe(false);
        expect(invalidTemplate.compiled).toBeUndefined();

        const invalidData = previewCompiledTemplate(
            {
                name: 'Completed {{courseName}}',
                description: 'Awarded for finishing {{courseName}}.',
            },
            { wrongKey: 'Intro to Baking' }
        );

        expect(invalidData.valid).toBe(false);
        expect(invalidData.compiled).toBeDefined();
        expect(invalidData.rendered).toBeUndefined();
        expect(invalidData.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: 'templateData.courseName' }),
                expect.objectContaining({ path: 'templateData.wrongKey' }),
            ])
        );
    });

    it('rejects invalid inline templates before posting to the host', async () => {
        const originalTop = Object.getOwnPropertyDescriptor(window, 'top');
        const originalLocation = Object.getOwnPropertyDescriptor(window, 'location');

        Object.defineProperty(window, 'top', {
            configurable: true,
            get: () => ({}) as Window,
        });
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                hostname: 'learncard.app',
                search: '',
                href: 'https://learncard.app/',
                ancestorOrigins: ['https://learncard.app'],
            },
        });

        const postMessageSpy = vi.spyOn(window.parent, 'postMessage');

        try {
            const lc = createPartnerConnect({ mock: false });

            await expect(
                lc.sendCredential({
                    alias: 'course-complete',
                    template: {
                        description: 'Missing name',
                    } as unknown as Parameters<typeof lc.validateCredentialTemplate>[0],
                })
            ).rejects.toMatchObject({ code: 'TEMPLATE_INVALID' });

            expect(postMessageSpy).not.toHaveBeenCalled();
        } finally {
            postMessageSpy.mockRestore();
            if (originalTop) Object.defineProperty(window, 'top', originalTop);
            if (originalLocation) Object.defineProperty(window, 'location', originalLocation);
        }
    });

    it('rejects invalid declarative consent scopes before posting to the host', async () => {
        const originalTop = Object.getOwnPropertyDescriptor(window, 'top');
        const originalLocation = Object.getOwnPropertyDescriptor(window, 'location');

        Object.defineProperty(window, 'top', {
            configurable: true,
            get: () => ({}) as Window,
        });
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                hostname: 'learncard.app',
                search: '',
                href: 'https://learncard.app/',
                ancestorOrigins: ['https://learncard.app'],
            },
        });

        const postMessageSpy = vi.spyOn(window.parent, 'postMessage');

        try {
            const lc = createPartnerConnect({ mock: false });

            await expect(
                lc.requestConsent({
                    read: { credentialCategories: ['NotARealCategory' as never] },
                })
            ).rejects.toMatchObject({ code: 'CONSENT_SCOPES_INVALID' });

            expect(postMessageSpy).not.toHaveBeenCalled();
        } finally {
            postMessageSpy.mockRestore();
            if (originalTop) Object.defineProperty(window, 'top', originalTop);
            if (originalLocation) Object.defineProperty(window, 'location', originalLocation);
        }
    });

    it('forwards raw declarative consent scopes to the host payload', async () => {
        const originalTop = Object.getOwnPropertyDescriptor(window, 'top');
        const originalLocation = Object.getOwnPropertyDescriptor(window, 'location');

        Object.defineProperty(window, 'top', {
            configurable: true,
            get: () => ({}) as Window,
        });
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                hostname: 'learncard.app',
                search: '',
                href: 'https://learncard.app/',
                ancestorOrigins: ['https://learncard.app'],
            },
        });

        let capturedMessage: unknown;
        const postMessageSpy = vi
            .spyOn(window.parent, 'postMessage')
            .mockImplementation((message: unknown) => {
                capturedMessage = message;

                const request = message as {
                    action?: string;
                    protocol?: string;
                    requestId?: string;
                };

                if (request.action !== 'REQUEST_CONSENT' || !request.requestId) return;

                window.dispatchEvent(
                    new MessageEvent('message', {
                        origin: 'https://learncard.app',
                        data: {
                            protocol: request.protocol,
                            requestId: request.requestId,
                            type: 'SUCCESS',
                            data: { granted: true },
                        },
                    })
                );
            });
        const scopes: ConsentRequest = {
            read: {
                credentialCategories: ['Achievement', 'Skill'],
                personalFields: ['name'],
            },
            write: {
                credentialCategories: ['Achievement'],
            },
            reason: 'Personalize your training plan',
        };

        try {
            const lc = createPartnerConnect({ mock: false });
            await expect(lc.requestConsent(scopes, { redirect: true })).resolves.toEqual({
                granted: true,
            });

            expect(postMessageSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'REQUEST_CONSENT',
                    payload: {
                        scopes,
                        redirect: true,
                    },
                }),
                'https://learncard.app'
            );

            expect(capturedMessage).toEqual(
                expect.objectContaining({
                    action: 'REQUEST_CONSENT',
                    payload: {
                        scopes,
                        redirect: true,
                    },
                })
            );
        } finally {
            postMessageSpy.mockRestore();
            if (originalTop) Object.defineProperty(window, 'top', originalTop);
            if (originalLocation) Object.defineProperty(window, 'location', originalLocation);
        }
    });
});

describe('mock counters', () => {
    it('increments, reads, and persists counters', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });

        const first = await lc.incrementCounter('coins', 10);
        expect(first).toEqual({ key: 'coins', previousValue: 0, newValue: 10 });

        const second = await lc.incrementCounter('coins', -3);
        expect(second.newValue).toBe(7);

        const read = await lc.getCounter('coins');
        expect(read.value).toBe(7);
        expect(read.updatedAt).not.toBeNull();

        const all = await lc.getCounters(['coins']);
        expect(all.counters[0]).toMatchObject({ key: 'coins', value: 7 });
    });

    it('persists counters across instances via localStorage', async () => {
        const a = createPartnerConnect({ mockOptions: { ui: false } });
        await a.incrementCounter('spins', 5);

        const b = createPartnerConnect({ mockOptions: { ui: false } });
        const read = await b.getCounter('spins');
        expect(read.value).toBe(5);
    });
});

describe('mock coherence (reads reflect this session writes)', () => {
    it('checkUserHasCredential reflects a template credential issued this session', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });

        const before = await lc.checkUserHasCredential({ templateAlias: 'algebra' });
        expect(before.hasCredential).toBe(false);

        await lc.sendCredential({ templateAlias: 'algebra' });

        const after = await lc.checkUserHasCredential({ templateAlias: 'algebra' });
        expect(after.hasCredential).toBe(true);
        expect(after.credentialUri).toBeDefined();
    });

    it('learner context and credential search include issued credentials', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });
        await lc.sendCredential({ templateAlias: 'algebra' });

        const context = await lc.requestLearnerContext({ format: 'structured' });
        expect(context.raw?.credentials.length).toBe(1);

        const search = await lc.askCredentialSearch({ query: [], challenge: 'c', domain: 'd' });
        expect(search.verifiablePresentation?.verifiableCredential.length).toBe(1);
    });

    it('learner context omits raw data unless format is structured', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });
        await lc.sendCredential({ templateAlias: 'algebra' });

        const context = await lc.requestLearnerContext();
        expect(context.raw).toBeUndefined();
        expect(context.prompt).toContain('algebra');
    });

    it('learner context respects includeCredentials: false', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });
        await lc.sendCredential({
            templateAlias: 'algebra',
            templateData: { name: 'Algebra 101' },
        });

        const context = await lc.requestLearnerContext({
            includeCredentials: false,
            format: 'structured',
        });
        expect(context.raw?.credentials.length).toBe(0);
        expect(context.prompt).not.toContain('Algebra 101');
    });

    it('AI sessions reuse one topic: first call creates it, later calls report isNewTopic false', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });
        const summaryData = {
            title: 'Session',
            summary: 'Mock summary',
            learned: [],
            nextSteps: [],
            reflections: [],
            skills: [],
        };

        const first = await lc.sendAiSessionCredential({ sessionTitle: 'One', summaryData });
        expect(first.isNewTopic).toBe(true);
        expect(first.topicCredentialUri).toBeDefined();

        const second = await lc.sendAiSessionCredential({ sessionTitle: 'Two', summaryData });
        expect(second.isNewTopic).toBe(false);
        expect(second.topicUri).toBe(first.topicUri);
        expect(second.topicCredentialUri).toBeUndefined();
        expect(second.sessionCredentialUri).not.toBe(first.sessionCredentialUri);
    });

    it('preventDuplicateClaim returns the existing credential', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });
        const first = (await lc.sendCredential({
            templateAlias: 'algebra',
            preventDuplicateClaim: true,
        })) as { credentialUri: string };
        const second = (await lc.sendCredential({
            templateAlias: 'algebra',
            preventDuplicateClaim: true,
        })) as { credentialUri: string; alreadyClaimed?: boolean };

        expect(second.alreadyClaimed).toBe(true);
        expect(second.credentialUri).toBe(first.credentialUri);
    });

    it('issues inline template credentials end-to-end and checkUserHasCredential stays coherent by alias', async () => {
        const lc = createPartnerConnect({ mock: true, mockOptions: { ui: false } });

        const issued = (await lc.sendCredential({
            alias: 'course-complete',
            template: {
                name: 'Completed {{courseName}}',
                description: 'Awarded for finishing {{courseName}}.',
                achievementType: 'Course',
                criteria: { narrative: 'Finished all modules' },
            },
            templateData: { courseName: 'Intro to Baking' },
        })) as { credentialUri: string; boostUri: string; templateVersion?: number };

        expect(issued.credentialUri).toContain('lc:mock:credential');
        expect(issued.boostUri).toContain('course-complete');
        expect(issued.templateVersion).toBe(1);

        const check = await lc.checkUserHasCredential({ templateAlias: 'course-complete' });
        expect(check.hasCredential).toBe(true);

        const context = await lc.requestLearnerContext({ format: 'structured' });
        const credential = context.raw?.credentials[0] as { name?: string; _mock?: boolean };

        expect(credential.name).toBe('Completed Intro to Baking');
        expect(credential._mock).toBe(true);
    });

    it('bumps inline template version when the template changes under the same alias', async () => {
        const lc = createPartnerConnect({ mock: true, mockOptions: { ui: false } });

        const first = (await lc.sendCredential({
            alias: 'course-complete',
            template: {
                name: 'Completed {{courseName}}',
                description: 'Awarded for finishing {{courseName}}.',
            },
            templateData: { courseName: 'Intro to Baking' },
        })) as { templateVersion?: number };

        const second = (await lc.sendCredential({
            alias: 'course-complete',
            template: {
                name: 'Graduated {{courseName}}',
                description: 'Awarded for finishing {{courseName}}.',
            },
            templateData: { courseName: 'Intro to Baking' },
        })) as { templateVersion?: number };

        expect(first.templateVersion).toBe(1);
        expect(second.templateVersion).toBe(2);
    });

    it('mock host rejects invalid inline events even when sendAppEvent is called directly', async () => {
        const lc = createPartnerConnect({ mock: true, mockOptions: { ui: false } });

        await expect(
            lc.sendAppEvent({
                type: 'send-credential',
                alias: 'course-complete',
                template: {
                    name: 'Completed {{courseName}}',
                },
                templateData: { wrongKey: 'Intro to Baking' },
            } as never)
        ).rejects.toMatchObject({ code: 'TEMPLATE_DATA_INVALID' });
    });

    it('mock rejections use PartnerConnectError instances', async () => {
        const lc = createPartnerConnect({ mock: true, mockOptions: { ui: false } });

        await expect(
            lc.sendAppEvent({
                type: 'send-credential',
                alias: 'course-complete',
                template: { name: 'Completed {{courseName}}' },
                templateData: { wrongKey: 'Intro to Baking' },
            } as never)
        ).rejects.toBeInstanceOf(PartnerConnectError);

        try {
            await lc.sendAppEvent({
                type: 'send-credential',
                alias: 'course-complete',
                template: { name: 'Completed {{courseName}}' },
                templateData: { wrongKey: 'Intro to Baking' },
            } as never);
        } catch (error) {
            expect(error).toBeInstanceOf(PartnerConnectError);
            expect(error).toMatchObject({ code: 'TEMPLATE_DATA_INVALID' });
        }
    });

    it('initiateTemplateIssue populates recipients and issuance status', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });
        await lc.initiateTemplateIssue('boost-xyz', ['alice', 'bob']);

        const recipients = await lc.getTemplateRecipients({ boostUri: 'boost-xyz' });
        expect(recipients.total).toBe(2);

        const status = await lc.getTemplateIssuanceStatus({
            boostUri: 'boost-xyz',
            recipient: 'alice',
        });
        expect(status.sent).toBe(true);
        expect(status.status).toBe('pending');
    });
});

describe('captured app manifest + publish URL', () => {
    it('accumulates and dedupes manifest data across mixed successful calls', async () => {
        document.title = '  Mock Partner App  ';

        const icon = document.createElement('link');
        icon.rel = 'icon';
        icon.href = '/favicon.ico';
        document.head.appendChild(icon);

        try {
            const lc = createPartnerConnect({
                mock: true,
                mockOptions: { ui: false, namespace: 'manifest-mixed' },
            });

            await lc.requestIdentity();
            await lc.requestConsent({
                read: {
                    credentialCategories: ['Skill', 'Achievement'],
                    personalFields: ['name'],
                },
                reason: 'First reason wins',
            });
            await lc.requestConsent({
                read: {
                    credentialCategories: ['Achievement', 'Skill'],
                    personalFields: ['name'],
                },
                reason: 'Second reason should be ignored',
            });
            await lc.sendCredential({ templateAlias: 'legacy-template' });
            await lc.launchFeature('/wallet');
            await lc.launchFeature('/wallet');
            await lc.askCredentialSearch({
                query: [],
                challenge: 'challenge',
                domain: 'example.test',
            });
            const issued = (await lc.sendCredential({
                alias: 'course-complete',
                template: {
                    name: 'Completed {{courseName}}',
                    description: 'Awarded for finishing {{courseName}}.',
                },
                templateData: { courseName: 'Algebra' },
            })) as { credentialUri: string };
            await lc.askCredentialSpecific(issued.credentialUri);
            await lc.initiateTemplateIssue('boost-xyz', ['alice']);
            await lc.requestLearnerContext({ format: 'structured' });
            await lc.sendNotification({ title: 'Hello' });
            await lc.incrementCounter('coins', 5);
            await lc.getCounter('coins');
            await lc.getCounters(['coins', 'stars']);

            const manifest = lc.getCapturedManifest();
            expect(manifest).toBeDefined();
            expect(manifest?.appUrl).toBe(`${window.location.origin}${window.location.pathname}`);
            expect(manifest?.suggestedName).toBe('Mock Partner App');
            expect(manifest?.suggestedIconUrl).toBe(
                new URL('/favicon.ico', window.location.href).toString()
            );
            expect(manifest?.permissions.sort()).toEqual(
                [
                    'credential_by_id',
                    'credential_search',
                    'launch_feature',
                    'request_consent',
                    'request_identity',
                    'send_credential',
                    'template_issuance',
                ].sort()
            );
            expect(manifest?.featuresLaunched).toEqual(['/wallet']);
            expect(manifest?.counterKeys.sort()).toEqual(['coins', 'stars'].sort());
            expect(manifest?.usedLearnerContext).toBe(true);
            expect(manifest?.usedNotifications).toBe(true);
            expect(manifest?.consentRequests).toHaveLength(1);
            expect(manifest?.consentRequests[0].reason).toBe('First reason wins');
            expect(manifest?.templates).toHaveLength(1);
            expect(manifest?.templates[0]).toMatchObject({
                alias: 'course-complete',
                version: 1,
            });
            expect(manifest?.firstCapturedAt).toBeDefined();
            expect(manifest?.lastUpdatedAt).toBeDefined();
        } finally {
            icon.remove();
        }
    });

    it('upserts inline templates by alias and stores the latest version + template body', async () => {
        const lc = createPartnerConnect({
            mock: true,
            mockOptions: { ui: false, namespace: 'manifest-inline-upsert' },
        });

        await lc.sendCredential({
            alias: 'course-complete',
            template: {
                name: 'Completed {{courseName}}',
                description: 'Awarded for finishing {{courseName}}.',
            },
            templateData: { courseName: 'Algebra' },
        });
        await lc.sendCredential({
            alias: 'course-complete',
            template: {
                name: 'Graduated {{courseName}}',
                description: 'Awarded for finishing {{courseName}}.',
            },
            templateData: { courseName: 'Algebra' },
        });

        expect(lc.getCapturedManifest()?.templates).toEqual([
            expect.objectContaining({
                alias: 'course-complete',
                version: 2,
                template: expect.objectContaining({ name: 'Graduated {{courseName}}' }),
            }),
        ]);
    });

    it('builds publish URLs as soon as any manifest has been captured', async () => {
        const lc = createPartnerConnect({
            mock: true,
            hostOrigin: ['capacitor://localhost', 'https://staging.learncard.app'],
            mockOptions: { ui: false, namespace: 'publish-threshold' },
        });

        expect(lc.getPublishUrl()).toBeUndefined();

        await lc.requestIdentity();
        expect(lc.getPublishUrl()).toContain(
            'https://staging.learncard.app/app-store/developer/submit?manifest='
        );

        await lc.launchFeature('/wallet');
        const publishUrl = lc.getPublishUrl();
        expect(publishUrl).toContain(
            'https://staging.learncard.app/app-store/developer/submit?manifest='
        );

        const encodedManifest = publishUrl?.split('manifest=')[1];
        expect(encodedManifest).toBeDefined();
        expect(decodeManifestFromUrl(encodedManifest ?? '')).toMatchObject({
            permissions: expect.arrayContaining(['request_identity', 'launch_feature']),
        });
    });

    it('suppresses the publish prompt for 24 hours after dismissal', async () => {
        const namespace = 'publish-dismissal';

        const first = createPartnerConnect({
            mock: true,
            mockOptions: { ui: true, namespace },
        });

        await first.requestIdentity();
        await first.launchFeature('/wallet');
        await flush();

        expect(document.body.textContent).toContain('Publish to LearnCard');

        const closeButton = document.querySelector('.lc-mock-close') as HTMLButtonElement | null;
        expect(closeButton).not.toBeNull();
        closeButton?.click();
        await new Promise(resolve => setTimeout(resolve, 250));
        expect(document.body.textContent).not.toContain('Publish to LearnCard');

        first.destroy();

        const second = createPartnerConnect({
            mock: true,
            mockOptions: { ui: true, namespace },
        });

        await second.requestIdentity();
        await second.launchFeature('/wallet');
        await flush();

        expect(document.body.textContent).not.toContain('Publish to LearnCard');
    });

    it('isolates captured manifests for different document titles on the same origin', async () => {
        const namespace = 'manifest-fingerprint-isolation';

        document.title = 'First Local App';
        const first = createPartnerConnect({
            mock: true,
            mockOptions: { ui: false, namespace },
        });
        await first.requestIdentity();
        await first.launchFeature('/wallet');

        document.title = 'Second Local App';
        const second = createPartnerConnect({
            mock: true,
            mockOptions: { ui: false, namespace },
        });
        await second.sendCredential({
            alias: 'course-complete',
            template: {
                name: 'Completed {{courseName}}',
                description: 'Awarded for finishing {{courseName}}.',
            },
            templateData: { courseName: 'Biology' },
        });

        expect(first.getCapturedManifest()).toMatchObject({
            suggestedName: 'First Local App',
            permissions: expect.arrayContaining(['request_identity', 'launch_feature']),
            templates: [],
        });
        expect(second.getCapturedManifest()).toMatchObject({
            suggestedName: 'Second Local App',
            templates: [expect.objectContaining({ alias: 'course-complete' })],
        });

        expect(readManifestMap(namespace)).toMatchObject({
            'first-local-app': expect.objectContaining({ suggestedName: 'First Local App' }),
            'second-local-app': expect.objectContaining({ suggestedName: 'Second Local App' }),
        });
    });

    it('restores the original manifest when switching back to a previous app title', async () => {
        const namespace = 'manifest-fingerprint-restore';

        document.title = 'App One';
        const first = createPartnerConnect({
            mock: true,
            mockOptions: { ui: false, namespace },
        });
        await first.requestIdentity();
        await first.launchFeature('/wallet');

        document.title = 'App Two';
        const second = createPartnerConnect({
            mock: true,
            mockOptions: { ui: false, namespace },
        });
        await second.sendCredential({ templateAlias: 'team-badge' });

        document.title = 'App One';
        const restored = createPartnerConnect({
            mock: true,
            mockOptions: { ui: false, namespace },
        });

        expect(restored.getCapturedManifest()).toMatchObject({
            suggestedName: 'App One',
            featuresLaunched: ['/wallet'],
            permissions: expect.arrayContaining(['request_identity', 'launch_feature']),
            templates: [],
        });
    });

    it('prefers mockOptions.appId over the title fingerprint heuristic', async () => {
        const namespace = 'manifest-explicit-app-id';

        document.title = 'Ignored Title';
        const lc = createPartnerConnect({
            mock: true,
            mockOptions: { ui: false, namespace, appId: 'custom-manifest-slot' },
        });
        await lc.requestIdentity();

        expect(readManifestMap(namespace)).toMatchObject({
            'custom-manifest-slot': expect.objectContaining({ suggestedName: 'Ignored Title' }),
        });
        expect(readManifestMap(namespace)['ignored-title']).toBeUndefined();
    });

    it('warns when the same fingerprint is reused across different page paths', () => {
        const namespace = 'manifest-fingerprint-warning';
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const originalLocation = Object.getOwnPropertyDescriptor(window, 'location');

        document.title = 'Shared App';
        localStorage.setItem(
            `${namespace}:manifests`,
            JSON.stringify({
                'shared-app': {
                    manifestVersion: 1,
                    appUrl: 'http://localhost/other-path',
                    suggestedName: 'Shared App',
                    permissions: ['request_identity'],
                    templates: [],
                    consentRequests: [],
                    featuresLaunched: [],
                    counterKeys: [],
                    usedLearnerContext: false,
                    usedNotifications: false,
                    firstCapturedAt: '2026-01-01T00:00:00.000Z',
                    lastUpdatedAt: '2026-01-01T00:00:00.000Z',
                },
            })
        );

        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                origin: 'http://localhost',
                pathname: '/current-path',
                hostname: 'localhost',
                search: '',
                href: 'http://localhost/current-path',
            },
        });

        try {
            createPartnerConnect({ mock: true, mockOptions: { ui: false, namespace } });
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Two apps may be sharing mock state')
            );
        } finally {
            if (originalLocation) Object.defineProperty(window, 'location', originalLocation);
        }
    });

    it('migrates the legacy single-manifest key into the fingerprinted map and removes it', () => {
        const namespace = 'manifest-legacy-migration';
        const legacyManifest: CapturedAppManifest = {
            manifestVersion: 1,
            appUrl: 'http://localhost:4321',
            suggestedName: 'Legacy App',
            permissions: ['request_identity'],
            templates: [],
            consentRequests: [],
            featuresLaunched: [],
            counterKeys: [],
            usedLearnerContext: false,
            usedNotifications: false,
            firstCapturedAt: '2026-01-01T00:00:00.000Z',
            lastUpdatedAt: '2026-01-01T00:00:00.000Z',
        };

        localStorage.setItem(`${namespace}:manifest`, JSON.stringify(legacyManifest));
        document.title = 'Legacy App';

        const lc = createPartnerConnect({
            mock: true,
            mockOptions: { ui: false, namespace },
        });

        expect(lc.getCapturedManifest()).toEqual({ ...legacyManifest, appKey: expect.any(String) });
        expect(localStorage.getItem(`${namespace}:manifest`)).toBeNull();
        expect(readManifestMap(namespace)).toMatchObject({
            'legacy-app': expect.objectContaining({ suggestedName: 'Legacy App' }),
        });
    });

    it("does not let one app's publish dismissal suppress another app on the same origin", async () => {
        const namespace = 'publish-dismissal-per-app';

        document.title = 'Dismissed App';
        const first = createPartnerConnect({
            mock: true,
            mockOptions: { ui: true, namespace },
        });
        await first.requestIdentity();
        await first.launchFeature('/wallet');
        await flush();

        const closeButton = document.querySelector('.lc-mock-close') as HTMLButtonElement | null;
        expect(closeButton).not.toBeNull();
        closeButton?.click();
        await new Promise(resolve => setTimeout(resolve, 250));

        first.destroy();

        document.title = 'Fresh App';
        const second = createPartnerConnect({
            mock: true,
            mockOptions: { ui: true, namespace },
        });
        await second.requestIdentity();
        await second.launchFeature('/wallet');
        await flush();

        expect(document.body.textContent).toContain('Publish to LearnCard');
        expect(
            localStorage.getItem(`${namespace}:publish-dismissed-at:dismissed-app`)
        ).toBeTruthy();
        expect(localStorage.getItem(`${namespace}:publish-dismissed-at:fresh-app`)).toBeNull();
    });

    it('caches the initial title after first manifest access instead of switching slots later', async () => {
        const namespace = 'manifest-title-cache';

        document.title = 'Initial Title App';
        const lc = createPartnerConnect({
            mock: true,
            mockOptions: { ui: false, namespace },
        });

        await lc.requestIdentity();
        document.title = 'Changed Route Title';
        await lc.launchFeature('/wallet');

        expect(lc.getCapturedManifest()).toMatchObject({
            suggestedName: 'Initial Title App',
            featuresLaunched: ['/wallet'],
        });
        expect(Object.keys(readManifestMap(namespace))).toEqual(['initial-title-app']);
    });
});

describe('mock seeding', () => {
    it('seeds identity did returned by requestIdentity', async () => {
        const lc = createPartnerConnect({
            mockOptions: { ui: false, identity: { did: 'did:web:seed:me', name: 'Ada' } },
        });
        const identity = await lc.requestIdentity();
        expect(identity.user.did).toBe('did:web:seed:me');
        expect((identity.user as { name?: string }).name).toBe('Ada');
    });

    it('seeds held credentials so happy-path reads work immediately', async () => {
        const lc = createPartnerConnect({
            mockOptions: {
                ui: false,
                credentials: [{ templateAlias: 'algebra', name: 'Algebra 101' }],
            },
        });
        const check = await lc.checkUserHasCredential({ templateAlias: 'algebra' });
        expect(check.hasCredential).toBe(true);
    });

    it('seeds initial counter values', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false, counters: { coins: 50 } } });
        const { value } = await lc.getCounter('coins');
        expect(value).toBe(50);
    });
});

describe('mock UI', () => {
    const toastCount = (): number => document.querySelectorAll('.lc-mock-toast').length;
    const toastText = (): string =>
        Array.from(document.querySelectorAll('.lc-mock-toast'))
            .map(n => n.textContent ?? '')
            .join('\n');

    it('renders a claim toast for sendCredential when ui is enabled', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: true } });
        await lc.sendCredential({ templateAlias: 'badge' });
        await flush();
        expect(toastCount()).toBe(1);
    });

    it('does not inject the manifest HUD when ui is disabled', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false, namespace: 'hud-hidden' } });
        await lc.requestIdentity();
        await flush();
        expect(document.querySelector('.lc-mock-hud')).toBeNull();
    });

    it('shows a collapsible manifest HUD and persists its expanded state', async () => {
        const namespace = 'hud-persisted-state';
        document.title = 'HUD Persisted State';
        const lc = createPartnerConnect({ mock: true, mockOptions: { ui: true, namespace } });

        await lc.requestIdentity();
        await flush();

        const collapsedButton = document.querySelector(
            '.lc-mock-hud-pill'
        ) as HTMLButtonElement | null;
        expect(collapsedButton?.textContent).toContain('Practice mode');
        expect(document.querySelector('.lc-mock-hud-card')).toBeNull();

        collapsedButton?.click();
        await flush();
        expect(document.querySelector('.lc-mock-hud-card')?.textContent).toContain(
            'Sign in with LearnCard'
        );
        expect(
            localStorage.getItem(`${namespace}:manifest-hud-collapsed:hud-persisted-state`)
        ).toBe('false');

        lc.destroy();

        const next = createPartnerConnect({ mock: true, mockOptions: { ui: true, namespace } });
        await next.requestIdentity();
        await flush();
        expect(document.querySelector('.lc-mock-hud-card')).not.toBeNull();
    });

    const expandHud = async (
        lc: ReturnType<typeof createPartnerConnect>,
        namespace: string
    ): Promise<void> => {
        localStorage.setItem(`${namespace}:manifest-hud-collapsed:${namespace}`, 'false');
        await lc.requestIdentity();
        await flush();
    };

    const HUD_HINT = 'Local LearnCard? Add ?lc_publish_override=http://localhost:3000';

    it('hints at lc_publish_override when publishing to production from localhost', async () => {
        const namespace = 'hud-hint-shown';
        const lc = createPartnerConnect({
            mock: true,
            mockOptions: { ui: true, namespace, appId: namespace },
        });

        await expandHud(lc, namespace);

        expect(document.querySelector('.lc-mock-hud-publish-hint')?.textContent).toBe(HUD_HINT);

        lc.destroy();
    });

    it('hides the hint when an explicit publishOrigin is set', async () => {
        const namespace = 'hud-hint-explicit';
        const lc = createPartnerConnect({
            mock: true,
            mockOptions: {
                ui: true,
                namespace,
                appId: namespace,
                publishOrigin: 'http://localhost:3000',
            },
        });

        await expandHud(lc, namespace);

        expect(document.querySelector('.lc-mock-hud')).not.toBeNull();
        expect(document.querySelector('.lc-mock-hud-publish-hint')).toBeNull();

        lc.destroy();
    });

    it('hides the hint when an lc_publish_override is already active', async () => {
        const namespace = 'hud-hint-override';
        sessionStorage.setItem('lc_publish_override', 'http://localhost:3000');

        const lc = createPartnerConnect({
            mock: true,
            mockOptions: { ui: true, namespace, appId: namespace },
        });

        await expandHud(lc, namespace);

        expect(lc.getPublishOrigin()).toBe('http://localhost:3000');
        expect(document.querySelector('.lc-mock-hud-publish-hint')).toBeNull();

        lc.destroy();
    });

    it('renders a positive-tone toast for requestConsent with scopes', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: true } });
        await lc.requestConsent({ read: { credentialCategories: ['Achievement'] } });
        await flush();
        expect(document.querySelector('.lc-mock-toast--positive')).not.toBeNull();
    });

    it('warns when requestConsent never says what it needs', async () => {
        const namespace = 'consent-setup';
        const lc = createPartnerConnect({
            mock: true,
            mockOptions: { ui: true, namespace, appId: namespace, publishPrompt: false },
        });
        localStorage.setItem(`${namespace}:manifest-hud-collapsed:${namespace}`, 'false');

        await lc.requestConsent();
        await flush();

        const warning = document.querySelector('.lc-mock-toast--warning');
        expect(warning?.textContent).toContain('Choose what to ask for');
        expect(document.querySelector('.lc-mock-toast--positive')).toBeNull();
        expect(document.querySelector('.lc-mock-hud-card')?.textContent).toContain(
            'Not set up yet'
        );
        expect(document.querySelector('.lc-mock-hud-setup-dot')).not.toBeNull();

        await lc.requestConsent({ read: { credentialCategories: ['Achievement'] } });
        await flush();
        expect(document.querySelector('.lc-mock-hud-card')?.textContent).not.toContain(
            'Not set up yet'
        );

        lc.destroy();
    });

    it('treats an existing consent contract as set up', async () => {
        const namespace = 'consent-contract';
        const lc = createPartnerConnect({
            mock: true,
            mockOptions: { ui: true, namespace, appId: namespace, publishPrompt: false },
        });
        await lc.requestConsent('lc:contract:1');
        await flush();
        expect(document.querySelector('.lc-mock-toast--warning')).toBeNull();
        lc.destroy();
    });

    it('surfaces a toast for every mocked action (not just console)', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: true, publishPrompt: false } });

        await lc.requestIdentity();
        await lc.launchFeature('/wallet');
        await lc.askCredentialSearch({ query: [], challenge: 'c', domain: 'd' });
        await lc.askCredentialSpecific('id');
        await lc.initiateTemplateIssue('boost');
        await lc.requestLearnerContext();
        await lc.getSyncStatus();
        await lc.checkUserHasCredential({ templateAlias: 't' });
        await lc.getTemplateIssuanceStatus({ templateAlias: 't', recipient: 'r' });
        await lc.getTemplateRecipients({ templateAlias: 't' });
        await lc.sendNotification({ title: 'Hi' });
        await lc.getCounter('coins');
        await flush();

        expect(toastCount()).toBe(12);
        expect(toastText()).toContain('/wallet');
    });

    it('coalesces identical repeated toasts into one with a count', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: true } });
        await lc.getSyncStatus();
        await lc.getSyncStatus();
        await lc.getSyncStatus();
        await flush();
        expect(toastCount()).toBe(1);
        expect(toastText()).toContain('×3');
    });

    it('keeps at most three transient notices on screen at once', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: true, publishPrompt: false } });

        await lc.requestIdentity();
        await lc.launchFeature('/wallet');
        await lc.getSyncStatus();
        await lc.sendNotification({ title: 'Hi' });
        await lc.getCounter('coins');
        await flush();

        const visible = Array.from(document.querySelectorAll('.lc-mock-toast')).filter(
            node => !node.classList.contains('lc-mock-toast--hidden')
        );
        expect(toastCount()).toBe(5);
        expect(visible).toHaveLength(3);
        expect(visible[visible.length - 1]?.textContent).toContain('coins');
    });

    it('lists what the app uses in plain language and offers a publish link', async () => {
        const namespace = 'hud-plain-language';
        const lc = createPartnerConnect({
            mock: true,
            mockOptions: { ui: true, namespace, appId: namespace, publishPrompt: false },
        });
        localStorage.setItem(`${namespace}:manifest-hud-collapsed:${namespace}`, 'false');

        await lc.requestIdentity();
        await lc.launchFeature('/ai/topics?shortCircuitStep=newTopic');
        await lc.requestLearnerContext();
        await flush();

        const card = document.querySelector('.lc-mock-hud-card');
        expect(card?.textContent).toContain('Sign in with LearnCard');
        expect(card?.textContent).toContain('/ai/topics');
        expect(card?.textContent).not.toContain('shortCircuitStep');
        expect(card?.textContent).not.toContain('request_identity');
        expect(
            (document.querySelector('.lc-mock-hud-publish') as HTMLAnchorElement | null)?.href
        ).toContain('/app-store/developer/submit?manifest=');

        lc.destroy();
    });

    it('keeps the publish card link in sync as the app uses more features', async () => {
        const namespace = 'publish-link-sync';
        const lc = createPartnerConnect({
            mock: true,
            mockOptions: { ui: true, namespace, appId: namespace },
        });

        await lc.requestIdentity();
        await lc.launchFeature('/wallet');
        await lc.requestLearnerContext();
        await flush();

        const href =
            (
                document.querySelector(
                    '.lc-mock-toast--publish .lc-mock-action'
                ) as HTMLAnchorElement | null
            )?.href ?? '';
        expect(href).toBe(lc.getPublishUrl());

        lc.destroy();
    });

    it('cleans up injected DOM on destroy', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: true } });
        await lc.requestConsent();
        await flush();
        lc.destroy();
        expect(toastCount()).toBe(0);
    });
});
