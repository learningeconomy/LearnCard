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
    namespace: string;
}

interface StoredCounter {
    value: number;
    updatedAt: string;
}

type MockStatus = 'pending' | 'claimed' | 'revoked';

interface MockCredential {
    credentialUri: string;
    boostUri?: string;
    templateAlias?: string;
    name: string;
    recipient: string;
    status: MockStatus;
    sentDate: string;
    claimedDate?: string;
    receivedDate?: string;
    credential: unknown;
}

interface TemplateQuery {
    templateAlias?: unknown;
    boostUri?: unknown;
}

type ToastTone = 'default' | 'positive';

/** A toast body is a list of plain strings and bold (`{ b }`) segments. */
type ToastSegment = string | { b: string };

interface ToastSpec {
    icon: string;
    segments: ToastSegment[];
    tone?: ToastTone;
    ttl?: number;
}

interface ActiveToast {
    node: HTMLElement;
    timeoutId: ReturnType<typeof setTimeout>;
    count: number;
    countEl: HTMLElement;
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

    /** Session-scoped credential store; reads reflect writes and seeds. */
    private readonly credentials: MockCredential[] = [];

    private readonly identity: { did: string; [key: string]: unknown };

    /** DOM nodes injected for visual feedback, tracked for cleanup. */
    private readonly domNodes = new Set<HTMLElement>();

    /** The app's single AI Topic, created lazily by the first AI session. */
    private aiTopic: { topicUri: string; topicCredentialUri: string } | null = null;

    private styleEl: HTMLStyleElement | null = null;
    private stackEl: HTMLElement | null = null;
    private readonly activeToasts = new Map<string, ActiveToast>();
    /** Pending exit-animation timers, tracked so `destroy()` can cancel them. */
    private readonly exitTimers = new Set<ReturnType<typeof setTimeout>>();
    private idSeq = 0;
    private destroyed = false;

    constructor(options?: MockHostOptions) {
        this.options = {
            ui: options?.ui ?? true,
            log: options?.log ?? true,
            persist: options?.persist ?? true,
            namespace: options?.namespace || DEFAULT_NAMESPACE,
        };

        this.identity = {
            ...(options?.identity ?? {}),
            did: options?.identity?.did || options?.did || DEFAULT_DID,
        };

        for (const seed of options?.credentials ?? []) {
            this.addCredential({
                name: seed.name || seed.templateAlias || 'Mock Credential',
                templateAlias: seed.templateAlias,
                boostUri: seed.boostUri,
                recipient: seed.recipient,
                status: seed.status,
            });
        }

        for (const [key, value] of Object.entries(options?.counters ?? {})) {
            if (this.readCounter(key) === undefined) this.writeCounter(key, value);
        }

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
                this.toast({
                    icon: '👤',
                    segments: ['In LearnCard, the user would sign in. Returning a mock identity.'],
                });
                return Promise.resolve({
                    token: `mock-token-${Date.now()}`,
                    user: { ...this.identity },
                });

            case 'SEND_CREDENTIAL': {
                const name = readAchievementName(payload);
                const credentialId = `mock-credential-${Date.now()}-${(this.idSeq += 1)}`;
                this.addCredential({
                    name,
                    credentialUri: credentialId,
                    credential: (payload as { credential?: unknown } | undefined)?.credential,
                });
                this.showClaimToast(name);
                return Promise.resolve({ credentialId, stored: true });
            }

            case 'REQUEST_CONSENT': {
                const redirect = Boolean((payload as { redirect?: boolean } | undefined)?.redirect);
                this.showConsentBanner(redirect);
                return Promise.resolve({ granted: true });
            }

            case 'LAUNCH_FEATURE': {
                const featurePath =
                    (payload as { featurePath?: string } | undefined)?.featurePath ?? '';
                this.toast({
                    icon: '🚀',
                    segments: featurePath
                        ? ['In LearnCard, this would open ', { b: featurePath }, '.']
                        : ['In LearnCard, this would open a feature screen.'],
                });
                return Promise.resolve({ launched: true, featurePath });
            }

            case 'ASK_CREDENTIAL_SEARCH': {
                const held = this.selfCredentials();
                this.toast({
                    icon: '🔍',
                    segments: held.length
                        ? ['The user could share ', { b: String(held.length) }, ' credential(s).']
                        : [
                              'In LearnCard, the user would be asked to share matching credentials. None in mock.',
                          ],
                });
                return Promise.resolve({
                    verifiablePresentation: {
                        verifiableCredential: held.map(c => c.credential),
                    },
                });
            }

            case 'ASK_CREDENTIAL_SPECIFIC': {
                const credentialId = (payload as { credentialId?: string } | undefined)
                    ?.credentialId;
                const found = this.credentials.find(c => c.credentialUri === credentialId);
                this.toast({
                    icon: '🔍',
                    segments: found
                        ? ['Sharing ', { b: found.name }, '.']
                        : [
                              'In LearnCard, the user would be asked to share a credential. Not found in mock.',
                          ],
                });
                return Promise.resolve({ credential: found?.credential });
            }

            case 'INITIATE_TEMPLATE_ISSUE': {
                const input = payload as
                    | { templateId?: string; draftRecipients?: string[] }
                    | undefined;
                const templateId = input?.templateId ?? '';
                const recipients = Array.isArray(input?.draftRecipients)
                    ? (input?.draftRecipients as string[])
                    : [];
                for (const recipient of recipients) {
                    this.addCredential({
                        name: templateId || 'Boost',
                        boostUri: templateId,
                        recipient,
                        status: 'pending',
                    });
                }
                this.toast({
                    icon: '📤',
                    segments: recipients.length
                        ? [
                              'This would issue to ',
                              { b: String(recipients.length) },
                              ' recipient(s).',
                          ]
                        : ['In LearnCard, this would open the Send Boost flow.'],
                });
                return Promise.resolve({ issued: true });
            }

            case 'REQUEST_LEARNER_CONTEXT': {
                const opts = (payload ?? {}) as {
                    includeCredentials?: boolean;
                    format?: string;
                };
                const includeCredentials = opts.includeCredentials !== false;
                const structured = opts.format === 'structured';
                const held = includeCredentials ? this.selfCredentials() : [];
                this.toast({
                    icon: '🧠',
                    segments: !includeCredentials
                        ? ['Learner profile requested with credentials excluded.']
                        : held.length
                        ? ['Learner profile: ', { b: String(held.length) }, ' credential(s).']
                        : ["In LearnCard, the user's learner profile would load. Empty in mock."],
                });
                const prompt = !includeCredentials
                    ? 'Mock learner context: credentials were not requested.'
                    : held.length
                    ? `Mock learner context. Credentials held: ${held.map(c => c.name).join(', ')}.`
                    : 'Mock learner context: this user has no credentials in standalone mode.';
                return Promise.resolve({
                    status: 'ready',
                    prompt,
                    did: this.identity.did,
                    // Matches the real host: `raw` only ships for format: 'structured'.
                    ...(structured ? { raw: { credentials: held.map(c => c.credential) } } : {}),
                });
            }

            case 'GET_SYNC_STATUS':
                this.toast({
                    icon: '🔄',
                    segments: [
                        'In LearnCard, this reports data sync progress. Mock reports ready.',
                    ],
                });
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
                this.toast({
                    icon: '✨',
                    segments: ['In LearnCard, this would run ', { b: action }, '.'],
                });
                return Promise.resolve({});
        }
    }

    /** Tear down injected UI and clear in-memory state. */
    public destroy(): void {
        this.destroyed = true;

        for (const entry of this.activeToasts.values()) clearTimeout(entry.timeoutId);
        this.activeToasts.clear();

        for (const timer of this.exitTimers) clearTimeout(timer);
        this.exitTimers.clear();

        for (const node of this.domNodes) node.remove();
        this.domNodes.clear();

        if (this.stackEl) {
            this.stackEl.remove();
            this.stackEl = null;
        }

        if (this.styleEl) {
            this.styleEl.remove();
            this.styleEl = null;
        }

        this.memoryCounters.clear();
        this.credentials.length = 0;
    }

    private handleAppEvent(event: Record<string, unknown>): Promise<unknown> {
        const type = typeof event?.type === 'string' ? event.type : '';

        switch (type) {
            case 'send-credential': {
                const name = readAchievementName(event);
                const templateAlias =
                    typeof event.templateAlias === 'string' ? event.templateAlias : undefined;
                const boostUri = `lc:mock:boost:${String(event.templateAlias ?? 'template')}`;

                if (event.preventDuplicateClaim) {
                    const existing = this.selfCredentials().find(c =>
                        this.matchesTemplate(c, { templateAlias, boostUri })
                    );
                    if (existing) {
                        this.toast({
                            icon: '✅',
                            segments: ['The user already has ', { b: existing.name }, '.'],
                        });
                        return Promise.resolve({
                            credentialUri: existing.credentialUri,
                            boostUri: existing.boostUri ?? boostUri,
                            alreadyClaimed: true,
                            hasCredential: true,
                            status: existing.status,
                            receivedDate: existing.receivedDate,
                        });
                    }
                }

                const record = this.addCredential({
                    name,
                    templateAlias,
                    boostUri,
                    status: 'claimed',
                });
                this.showClaimToast(name);
                return Promise.resolve({
                    credentialUri: record.credentialUri,
                    boostUri: record.boostUri ?? boostUri,
                    alreadyClaimed: false,
                    hasCredential: true,
                    status: 'claimed',
                    receivedDate: record.receivedDate,
                });
            }

            case 'check-credential': {
                const held = this.selfCredentials().find(c => this.matchesTemplate(c, event));
                this.toast({
                    icon: '🔎',
                    segments: held
                        ? ['The user already has ', { b: held.name }, '.']
                        : ["Mock: the user doesn't have this credential yet."],
                });
                return Promise.resolve(
                    held
                        ? {
                              hasCredential: true,
                              credentialUri: held.credentialUri,
                              receivedDate: held.receivedDate,
                              status: held.status,
                          }
                        : { hasCredential: false }
                );
            }

            case 'check-issuance-status': {
                const recipient = typeof event.recipient === 'string' ? event.recipient : '';
                const match = this.credentials.find(
                    c => this.matchesTemplate(c, event) && c.recipient === recipient
                );
                this.toast({
                    icon: '🔎',
                    segments: match
                        ? ['Issued to ', { b: recipient }, ' — ', { b: match.status }, '.']
                        : ['Mock: not sent to this recipient yet.'],
                });
                return Promise.resolve(
                    match
                        ? {
                              sent: true,
                              credentialUri: match.credentialUri,
                              sentDate: match.sentDate,
                              claimedDate: match.claimedDate,
                              status: match.status,
                          }
                        : { sent: false }
                );
            }

            case 'get-template-recipients': {
                const matched = this.credentials.filter(c => this.matchesTemplate(c, event));
                const limit =
                    typeof event.limit === 'number' && event.limit > 0 ? event.limit : undefined;
                // Cursor pagination: the cursor is the offset of the next record,
                // issued by the previous page so callers can walk the full list.
                const parsedCursor =
                    typeof event.cursor === 'string' ? Number.parseInt(event.cursor, 10) : 0;
                const offset = Number.isFinite(parsedCursor) && parsedCursor > 0 ? parsedCursor : 0;
                const page = limit ? matched.slice(offset, offset + limit) : matched.slice(offset);
                const nextOffset = offset + page.length;
                const hasMore = nextOffset < matched.length;
                this.toast({
                    icon: '👥',
                    segments: [
                        'In LearnCard, this lists recipients. ',
                        { b: String(matched.length) },
                        ' in mock.',
                    ],
                });
                return Promise.resolve({
                    records: page.map(c => this.toRecipientRecord(c)),
                    hasMore,
                    ...(hasMore ? { cursor: String(nextOffset) } : {}),
                    total: matched.length,
                });
            }

            case 'send-notification': {
                const title = typeof event.title === 'string' ? event.title : '';
                const body = typeof event.body === 'string' ? event.body : '';
                const text = [title, body].filter(Boolean).join(' — ');
                this.toast({
                    icon: '🔔',
                    segments: text
                        ? ['The user would be notified: ', { b: text }]
                        : ['In LearnCard, the user would receive a notification.'],
                });
                return Promise.resolve({ sent: true });
            }

            case 'increment-counter': {
                const key = String(event.key ?? '');
                const amount = typeof event.amount === 'number' ? event.amount : 0;
                const previous = this.readCounter(key)?.value ?? 0;
                const next = previous + amount;
                this.writeCounter(key, next);
                this.toast({
                    icon: '🔢',
                    segments: ['Counter ', { b: key }, ' → ', { b: String(next) }, '.'],
                });
                return Promise.resolve({ key, previousValue: previous, newValue: next });
            }

            case 'get-counter': {
                const key = String(event.key ?? '');
                const stored = this.readCounter(key);
                const value = stored?.value ?? 0;
                this.toast({
                    icon: '🔢',
                    segments: ['Counter ', { b: key }, ' is ', { b: String(value) }, '.'],
                });
                return Promise.resolve({
                    key,
                    value,
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
                this.toast({
                    icon: '🔢',
                    segments: ['Read ', { b: String(counters.length) }, ' counter(s).'],
                });
                return Promise.resolve({ counters });
            }

            case 'send-ai-session-credential': {
                const sessionTitle =
                    typeof event.sessionTitle === 'string' && event.sessionTitle
                        ? event.sessionTitle
                        : 'AI session';
                const sessionBoostUri = this.nextUri('lc:mock:session-boost');
                const record = this.addCredential({
                    name: sessionTitle,
                    boostUri: sessionBoostUri,
                    status: 'claimed',
                });
                this.toast({
                    icon: '✅',
                    segments: [
                        'In LearnCard, an AI session credential would be saved: ',
                        { b: sessionTitle },
                    ],
                });

                // Mirrors the real host's topic hierarchy: the first session
                // creates the app's AI Topic (returning its credential URI);
                // later sessions reuse it and report isNewTopic: false.
                const isNewTopic = this.aiTopic === null;
                if (!this.aiTopic) {
                    this.aiTopic = {
                        topicUri: this.nextUri('lc:mock:topic'),
                        topicCredentialUri: this.nextUri('lc:mock:topic-credential'),
                    };
                }

                return Promise.resolve({
                    topicUri: this.aiTopic.topicUri,
                    ...(isNewTopic ? { topicCredentialUri: this.aiTopic.topicCredentialUri } : {}),
                    sessionCredentialUri: record.credentialUri,
                    sessionBoostUri,
                    isNewTopic,
                });
            }

            default:
                this.toast({
                    icon: '✨',
                    segments: ['In LearnCard, this would run ', { b: type }, '.'],
                });
                return Promise.resolve({});
        }
    }

    private nextUri(prefix: string): string {
        this.idSeq += 1;
        return `${prefix}:${Date.now()}-${this.idSeq}`;
    }

    private buildMockVc(name: string, id: string): Record<string, unknown> {
        return {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id,
            type: ['VerifiableCredential'],
            issuer: this.identity.did,
            credentialSubject: { id: this.identity.did, achievement: { name } },
            _mock: true,
        };
    }

    private addCredential(input: {
        name: string;
        templateAlias?: string;
        boostUri?: string;
        recipient?: string;
        status?: MockStatus;
        credentialUri?: string;
        credential?: unknown;
    }): MockCredential {
        const now = new Date().toISOString();
        const status: MockStatus = input.status ?? 'claimed';
        const credentialUri = input.credentialUri ?? this.nextUri('lc:mock:credential');
        const record: MockCredential = {
            credentialUri,
            boostUri: input.boostUri,
            templateAlias: input.templateAlias,
            name: input.name,
            recipient: input.recipient || this.identity.did,
            status,
            sentDate: now,
            claimedDate: status === 'claimed' ? now : undefined,
            receivedDate: status === 'claimed' ? now : undefined,
            credential: input.credential ?? this.buildMockVc(input.name, credentialUri),
        };
        this.credentials.push(record);
        return record;
    }

    private selfCredentials(): MockCredential[] {
        return this.credentials.filter(c => c.recipient === this.identity.did);
    }

    private matchesTemplate(c: MockCredential, q: TemplateQuery): boolean {
        if (typeof q.templateAlias === 'string') return c.templateAlias === q.templateAlias;
        if (typeof q.boostUri === 'string') return c.boostUri === q.boostUri;
        return false;
    }

    private toRecipientRecord(c: MockCredential): {
        recipientProfileId: string;
        recipientDisplayName: string;
        sentDate: string;
        claimedDate?: string;
        credentialUri: string;
        status: MockStatus;
    } {
        return {
            recipientProfileId: c.recipient,
            recipientDisplayName: c.recipient,
            sentDate: c.sentDate,
            claimedDate: c.claimedDate,
            credentialUri: c.credentialUri,
            status: c.status,
        };
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

    /**
     * The load → patch → save cycle below runs synchronously within one task,
     * so increments in the same tab can never interleave. Concurrent writes
     * from *other tabs* sharing the namespace can still be lost — acceptable
     * for a dev-only mock, and inherent to `localStorage` without web locks.
     */
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

    private showClaimToast(credentialName: string): void {
        this.toast({
            icon: '✅',
            ttl: 5200,
            segments: ['In LearnCard, the user would receive ', { b: credentialName }, ' here.'],
        });
    }

    private showConsentBanner(redirectIgnored = false): void {
        this.toast({
            icon: '🔓',
            tone: 'positive',
            segments: redirectIgnored
                ? ['Consent auto-granted. Redirect ignored in mock.']
                : ['The user would review and grant consent. Auto-granted in mock.'],
        });

        if (redirectIgnored) {
            this.note(
                "requestConsent: 'redirect' is ignored in mock mode — the real host would " +
                    "navigate to the contract's redirectUrl with the VP in the URL."
            );
        }
    }

    private note(message: string): void {
        if (!this.options.log) return;
        // eslint-disable-next-line no-console
        console.log(`${MOCK_PREFIX} ${message}`);
    }

    /**
     * Show a branded toast describing what the real host would do. Identical
     * messages coalesce into one toast with a ×N counter so repeated or polled
     * calls never spam the screen.
     */
    private toast(spec: ToastSpec): void {
        if (!this.options.ui || !hasDocument()) return;

        const tone = spec.tone ?? 'default';
        const ttl = spec.ttl ?? 4200;
        const text = spec.segments.map(s => (typeof s === 'string' ? s : s.b)).join('');
        const key = `${tone}|${spec.icon}|${text}`;

        const existing = this.activeToasts.get(key);
        if (existing) {
            existing.count += 1;
            existing.countEl.textContent = `×${existing.count}`;
            existing.countEl.style.display = '';
            clearTimeout(existing.timeoutId);
            existing.timeoutId = setTimeout(() => this.dismissToast(key), ttl);
            return;
        }

        const stack = this.ensureStack();
        if (!stack) return;
        this.ensureStyles();

        const toast = document.createElement('div');
        toast.className = `lc-mock-toast lc-mock-toast--${tone}`;

        const badge = document.createElement('div');
        badge.className = 'lc-mock-badge';
        const name = document.createElement('span');
        name.className = 'lc-mock-badge-name';
        name.textContent = `${spec.icon} LearnCard`;
        const pill = document.createElement('span');
        pill.className = 'lc-mock-pill';
        pill.textContent = 'MOCK';
        badge.append(name, pill);

        const body = document.createElement('div');
        body.className = 'lc-mock-body';
        for (const seg of spec.segments) {
            if (typeof seg === 'string') {
                body.append(seg);
            } else {
                const strong = document.createElement('strong');
                strong.textContent = seg.b;
                body.appendChild(strong);
            }
        }

        const countEl = document.createElement('span');
        countEl.className = 'lc-mock-count';
        countEl.style.display = 'none';
        body.appendChild(countEl);

        toast.append(badge, body);
        stack.appendChild(toast);
        this.domNodes.add(toast);

        const timeoutId = setTimeout(() => this.dismissToast(key), ttl);
        this.activeToasts.set(key, { node: toast, timeoutId, count: 1, countEl });
    }

    private dismissToast(key: string): void {
        const entry = this.activeToasts.get(key);
        if (!entry) return;

        this.activeToasts.delete(key);
        clearTimeout(entry.timeoutId);

        const { node } = entry;
        node.classList.add('lc-mock-out');
        const exitTimer = setTimeout(() => {
            this.exitTimers.delete(exitTimer);
            node.remove();
            this.domNodes.delete(node);
        }, 200);
        this.exitTimers.add(exitTimer);
    }

    private ensureStack(): HTMLElement | null {
        if (!document.body) return null;
        if (this.stackEl && document.body.contains(this.stackEl)) return this.stackEl;

        const stack = document.createElement('div');
        stack.className = 'lc-mock-stack';
        document.body.appendChild(stack);
        this.stackEl = stack;
        return stack;
    }

    private ensureStyles(): void {
        if (!this.options.ui || !hasDocument() || this.styleEl || !document.head) return;

        const style = document.createElement('style');
        style.textContent = `
@keyframes lc-mock-in { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes lc-mock-out { to { opacity: 0; transform: translateY(6px); } }
.lc-mock-stack {
  position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
  display: flex; flex-direction: column; gap: 10px; align-items: flex-end;
  pointer-events: none; max-width: min(360px, calc(100vw - 40px));
}
.lc-mock-toast {
  pointer-events: auto; width: 100%; box-sizing: border-box; padding: 11px 14px; border-radius: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px;
  line-height: 1.45; box-shadow: 0 10px 30px rgba(24,34,78,0.22); animation: lc-mock-in 180ms cubic-bezier(0.2,0.8,0.2,1);
}
.lc-mock-toast.lc-mock-out { animation: lc-mock-out 180ms ease-in forwards; }
.lc-mock-toast--default { background: #18224E; color: #fff; }
.lc-mock-toast--positive { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
.lc-mock-badge {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px;
  font-size: 11px; letter-spacing: 0.02em; text-transform: uppercase; opacity: 0.72;
}
.lc-mock-badge-name { font-weight: 600; }
.lc-mock-pill { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px; background: rgba(255,255,255,0.16); }
.lc-mock-toast--positive .lc-mock-pill { background: rgba(6,95,70,0.12); }
.lc-mock-body strong { font-weight: 700; }
.lc-mock-count { margin-left: 6px; font-weight: 700; opacity: 0.75; }
`.trim();

        document.head.appendChild(style);
        this.styleEl = style;
    }
}
