/**
 * Standalone mock host for the Partner Connect SDK.
 *
 * When the SDK is not embedded in a real LearnCard host there is nothing to
 * answer its `postMessage` requests. `MockHost` locally simulates the host so
 * partner apps are fully buildable, demo-able, and testable in isolation. It
 * intercepts the SDK's single `sendMessage(action, payload)` chokepoint and
 * returns responses that match the shapes the real host produces.
 *
 * This module is browser-oriented but SSR-safe: it never touches `document` at
 * import time and degrades to log-only behavior when the DOM is unavailable.
 */

import type { MockHostOptions } from './types';

const DEFAULT_DID = 'did:web:mock.learncard.app:user';
const DEFAULT_NAMESPACE = 'lc-mock';
const MOCK_PREFIX = '[LearnCard SDK · MOCK]';

interface ResolvedMockOptions {
    ui: boolean;
    log: boolean;
    persist: boolean;
    did: string;
    namespace: string;
}

interface StoredCounter {
    value: number;
    updatedAt: string;
}

const hasDocument = (): boolean =>
    typeof document !== 'undefined' && typeof document.createElement === 'function';

const readAchievementName = (payload: unknown): string => {
    if (!payload || typeof payload !== 'object') return 'a credential';

    const record = payload as Record<string, unknown>;

    // Template-based issuance (APP_EVENT / send-credential).
    if (typeof record.templateAlias === 'string' && record.templateAlias) {
        const data = record.templateData;
        if (data && typeof data === 'object') {
            const fields = data as Record<string, unknown>;
            const named =
                fields.name ?? fields.achievementName ?? fields.courseName ?? fields.title;
            if (typeof named === 'string' && named) return named;
        }
        return record.templateAlias;
    }

    // Raw verifiable credential.
    const credential = (record.credential ?? record) as Record<string, unknown>;
    if (credential && typeof credential === 'object') {
        const subject = credential.credentialSubject as Record<string, unknown> | undefined;
        const achievement = subject?.achievement as Record<string, unknown> | undefined;
        if (achievement && typeof achievement.name === 'string' && achievement.name) {
            return achievement.name;
        }
        if (typeof credential.name === 'string' && credential.name) return credential.name;
    }

    return 'a credential';
};

/**
 * Simulates the LearnCard host for a single {@link PartnerConnect} instance.
 * All public methods route through `handle`, keeping the mock behind the same
 * `(action, payload)` contract the real host answers over `postMessage`.
 */
export class MockHost {
    private readonly options: ResolvedMockOptions;

    /** In-memory counter fallback used when persistence is off/unavailable. */
    private readonly memoryCounters = new Map<string, StoredCounter>();

    /** DOM nodes injected for visual feedback, tracked for cleanup. */
    private readonly domNodes = new Set<HTMLElement>();

    private styleEl: HTMLStyleElement | null = null;
    private destroyed = false;

    constructor(options?: MockHostOptions) {
        this.options = {
            ui: options?.ui ?? true,
            log: options?.log ?? true,
            persist: options?.persist ?? true,
            did: options?.did || DEFAULT_DID,
            namespace: options?.namespace || DEFAULT_NAMESPACE,
        };

        this.announce();
    }

    /**
     * Resolve a simulated response for one SDK request. Mirrors the real host:
     * direct actions map 1:1, and `APP_EVENT` is dispatched by its `type`.
     */
    public handle(action: string, payload?: unknown): Promise<unknown> {
        if (this.destroyed) {
            return Promise.reject({
                code: 'SDK_DESTROYED',
                message: 'Mock host was destroyed before the request completed',
            });
        }

        this.log(action, payload);

        if (action === 'APP_EVENT') {
            return this.handleAppEvent(payload as Record<string, unknown>);
        }

        switch (action) {
            case 'REQUEST_IDENTITY':
                return Promise.resolve({
                    token: `mock-token-${Date.now()}`,
                    user: { did: this.options.did },
                });

            case 'SEND_CREDENTIAL': {
                const name = readAchievementName(payload);
                this.showClaimToast(name);
                return Promise.resolve({
                    credentialId: `mock-credential-${Date.now()}`,
                    stored: true,
                });
            }

            case 'REQUEST_CONSENT':
                this.showConsentBanner();
                return Promise.resolve({ granted: true });

            case 'LAUNCH_FEATURE': {
                const featurePath =
                    (payload as { featurePath?: string } | undefined)?.featurePath ?? '';
                this.showToast(`Would launch feature: ${featurePath || '(unspecified)'}`);
                return Promise.resolve({ launched: true, featurePath });
            }

            case 'ASK_CREDENTIAL_SEARCH':
                return Promise.resolve({
                    verifiablePresentation: { verifiableCredential: [] },
                });

            case 'ASK_CREDENTIAL_SPECIFIC':
                return Promise.resolve({ credential: undefined });

            case 'INITIATE_TEMPLATE_ISSUE':
                this.showToast('Would open the Send Boost flow');
                return Promise.resolve({ issued: true });

            case 'REQUEST_LEARNER_CONTEXT':
                return Promise.resolve({
                    status: 'ready',
                    prompt: 'Mock learner context: this user has no credentials in standalone mode.',
                    did: this.options.did,
                    raw: { credentials: [] },
                });

            case 'GET_SYNC_STATUS':
                return Promise.resolve({
                    status: 'ready',
                    progress: {
                        totalCredentials: 0,
                        completedCredentials: 0,
                        failedCredentials: 0,
                        retryCount: 0,
                    },
                });

            default:
                return Promise.resolve({});
        }
    }

    /** Tear down injected UI and clear in-memory state. */
    public destroy(): void {
        this.destroyed = true;

        for (const node of this.domNodes) node.remove();
        this.domNodes.clear();

        if (this.styleEl) {
            this.styleEl.remove();
            this.styleEl = null;
        }

        this.memoryCounters.clear();
    }

    private handleAppEvent(event: Record<string, unknown>): Promise<unknown> {
        const type = typeof event?.type === 'string' ? event.type : '';

        switch (type) {
            case 'send-credential': {
                const name = readAchievementName(event);
                this.showClaimToast(name);
                return Promise.resolve({
                    credentialUri: `lc:mock:credential:${Date.now()}`,
                    boostUri: `lc:mock:boost:${String(event.templateAlias ?? 'template')}`,
                    alreadyClaimed: false,
                    hasCredential: true,
                    status: 'claimed',
                    receivedDate: new Date().toISOString(),
                });
            }

            case 'check-credential':
                return Promise.resolve({ hasCredential: false });

            case 'check-issuance-status':
                return Promise.resolve({ sent: false });

            case 'get-template-recipients':
                return Promise.resolve({ records: [], hasMore: false, total: 0 });

            case 'send-notification': {
                const title = typeof event.title === 'string' ? event.title : '';
                const body = typeof event.body === 'string' ? event.body : '';
                this.showToast(`Notification: ${[title, body].filter(Boolean).join(' — ')}`);
                return Promise.resolve({ sent: true });
            }

            case 'increment-counter': {
                const key = String(event.key ?? '');
                const amount = typeof event.amount === 'number' ? event.amount : 0;
                const previous = this.readCounter(key)?.value ?? 0;
                const next = previous + amount;
                this.writeCounter(key, next);
                return Promise.resolve({ key, previousValue: previous, newValue: next });
            }

            case 'get-counter': {
                const key = String(event.key ?? '');
                const stored = this.readCounter(key);
                return Promise.resolve({
                    key,
                    value: stored?.value ?? 0,
                    updatedAt: stored?.updatedAt ?? null,
                });
            }

            case 'get-counters': {
                const requested = Array.isArray(event.keys)
                    ? (event.keys as unknown[]).map(String)
                    : this.allCounterKeys();
                const counters = requested.map(key => {
                    const stored = this.readCounter(key);
                    return { key, value: stored?.value ?? 0, updatedAt: stored?.updatedAt ?? null };
                });
                return Promise.resolve({ counters });
            }

            case 'send-ai-session-credential':
                return Promise.resolve({
                    topicUri: `lc:mock:topic:${Date.now()}`,
                    sessionCredentialUri: `lc:mock:session-credential:${Date.now()}`,
                    sessionBoostUri: `lc:mock:session-boost:${Date.now()}`,
                    isNewTopic: true,
                });

            default:
                return Promise.resolve({});
        }
    }

    private counterStorageKey(): string {
        return `${this.options.namespace}:counters`;
    }

    private loadCounters(): Record<string, StoredCounter> {
        if (this.options.persist && typeof localStorage !== 'undefined') {
            try {
                const raw = localStorage.getItem(this.counterStorageKey());
                if (raw) return JSON.parse(raw) as Record<string, StoredCounter>;
            } catch {
                // Corrupt or unavailable storage: fall through to in-memory.
            }
        }

        const fromMemory: Record<string, StoredCounter> = {};
        for (const [key, value] of this.memoryCounters) fromMemory[key] = value;
        return fromMemory;
    }

    private readCounter(key: string): StoredCounter | undefined {
        return this.loadCounters()[key];
    }

    private allCounterKeys(): string[] {
        return Object.keys(this.loadCounters());
    }

    private writeCounter(key: string, value: number): void {
        const entry: StoredCounter = { value, updatedAt: new Date().toISOString() };

        if (this.options.persist && typeof localStorage !== 'undefined') {
            try {
                const all = this.loadCounters();
                all[key] = entry;
                localStorage.setItem(this.counterStorageKey(), JSON.stringify(all));
                return;
            } catch {
                // Fall back to in-memory storage below.
            }
        }

        this.memoryCounters.set(key, entry);
    }

    private log(action: string, payload?: unknown): void {
        if (!this.options.log) return;
        // eslint-disable-next-line no-console
        console.log(`${MOCK_PREFIX} ${action}`, payload ?? '');
    }

    private announce(): void {
        if (!this.options.log) return;
        // eslint-disable-next-line no-console
        console.log(
            `${MOCK_PREFIX} Standalone mock mode is active. The SDK is simulating the ` +
                'LearnCard host locally. When embedded in a real host, these calls run ' +
                'against it unchanged.'
        );
    }

    private ensureStyles(): void {
        if (!this.options.ui || !hasDocument() || this.styleEl) return;

        const style = document.createElement('style');
        style.textContent = `
@keyframes lc-mock-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.lc-mock-toast, .lc-mock-banner {
  position: fixed; z-index: 2147483647; left: 50%; transform: translateX(-50%);
  max-width: 90vw; box-sizing: border-box; padding: 12px 16px; border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px;
  line-height: 1.4; box-shadow: 0 8px 24px rgba(24,34,78,0.18); animation: lc-mock-in 160ms ease-out;
}
.lc-mock-toast { bottom: 24px; background: #18224E; color: #fff; }
.lc-mock-toast strong { font-weight: 600; }
.lc-mock-banner { top: 24px; background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
`.trim();

        document.head.appendChild(style);
        this.styleEl = style;
    }

    private mount(node: HTMLElement, ttlMs: number): void {
        if (!hasDocument()) return;

        this.ensureStyles();
        document.body.appendChild(node);
        this.domNodes.add(node);

        setTimeout(() => {
            node.remove();
            this.domNodes.delete(node);
        }, ttlMs);
    }

    private showToast(message: string): void {
        if (!this.options.ui || !hasDocument()) return;

        const toast = document.createElement('div');
        toast.className = 'lc-mock-toast';
        toast.textContent = message;
        this.mount(toast, 4000);
    }

    private showClaimToast(credentialName: string): void {
        if (!this.options.ui || !hasDocument()) return;

        const toast = document.createElement('div');
        toast.className = 'lc-mock-toast';

        const check = document.createElement('span');
        check.textContent = '✅ ';

        const strong = document.createElement('strong');
        strong.textContent = credentialName;

        toast.appendChild(check);
        toast.append('In LearnCard, the user would receive ');
        toast.appendChild(strong);
        toast.append(' here.');

        this.mount(toast, 5000);
    }

    private showConsentBanner(): void {
        if (!this.options.ui || !hasDocument()) return;

        const banner = document.createElement('div');
        banner.className = 'lc-mock-banner';
        banner.textContent = '🔓 Mock consent granted automatically (standalone mode).';
        this.mount(banner, 4000);
    }
}
