/**
 * Tests for standalone mock mode and embed detection in
 * @learncard/partner-connect. These run in jsdom, where `window.self` equals
 * `window.top` (i.e. not embedded), so 'auto' mock mode is active by default.
 */

import { PartnerConnect, createPartnerConnect, isEmbedded } from './index';

const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

let errorSpy: jest.SpyInstance;

beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
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
});

describe('embedded parent classification', () => {
    let originalTop: PropertyDescriptor | undefined;
    let originalLocation: PropertyDescriptor | undefined;

    const embedIn = (ancestorOrigin: string | null, hostname = 'localhost'): void => {
        Object.defineProperty(window, 'top', {
            configurable: true,
            get: () => ({} as Window),
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
