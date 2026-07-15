/**
 * Tests for standalone mock mode and embed detection in
 * @learncard/partner-connect. These run in jsdom, where `window.self` equals
 * `window.top` (i.e. not embedded), so 'auto' mock mode is active by default.
 */

import { PartnerConnect, createPartnerConnect, isEmbedded } from './index';

const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
        localStorage.clear();
    } catch {
        // localStorage may be unavailable in some environments.
    }
});

afterEach(() => {
    jest.restoreAllMocks();
    document.querySelectorAll('.lc-mock-toast, .lc-mock-stack').forEach(node => node.remove());
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
            get: () => ({} as Window),
        });

        try {
            expect(isEmbedded()).toBe(true);
        } finally {
            if (originalTop) Object.defineProperty(window, 'top', originalTop);
        }
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

    it('reports a ready sync status so onSyncComplete resolves', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: false } });
        await expect(lc.getSyncStatus()).resolves.toMatchObject({ status: 'ready' });
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

    it('renders a positive-tone toast for requestConsent', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: true } });
        await lc.requestConsent();
        await flush();
        expect(document.querySelector('.lc-mock-toast--positive')).not.toBeNull();
    });

    it('surfaces a toast for every mocked action (not just console)', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: true } });

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

    it('cleans up injected DOM on destroy', async () => {
        const lc = createPartnerConnect({ mockOptions: { ui: true } });
        await lc.requestConsent();
        await flush();
        lc.destroy();
        expect(toastCount()).toBe(0);
    });
});
