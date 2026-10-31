/**
 * Test-only fakes for provisioning (never bundled: nothing outside tests imports
 * this file). A synthetic lca-api login, Firebase REST, SSS strategy, versioned
 * Secrets Manager and inbox. All values are synthetic placeholders.
 */
import type { SSSStorageFunctions } from '@learncard/sss-key-manager';
import type { Config } from '../config';
import { holdLabel, type RunnerConfig } from '../tier3/config';
import { createMemoryLedger, type Ledger } from '../tier3/ledger';
import { buildEmail, runnerConfig, type EmailOptions } from '../tier3/test-fakes';
import { ProvisionError } from './errors';
import type { ProvisionDeps, ProvisionOptions, ProvisionStrategy } from './flow';
import type { LoginClient } from './login';
import type { Plan } from './preflight';
import type { SecretMetadata, StagedSecretStore } from './secret-writer';
import { tier12Target, tier3Targets, type Target } from './targets';

export const LOGIN_SENDER = 'login@mail.example.com';
export const LOGIN_DKIM_DOMAIN = 'mail.example.com';
export const PROJECT = 'test-project';
export const loginMail = {
    sender: LOGIN_SENDER,
    dkimDomain: LOGIN_DKIM_DOMAIN,
    requireDmarc: true,
};

/** The rendered `login-verification-code` text part (en), with a synthetic code. */
export const loginBody = (code: string, brand = 'LearnCard'): string =>
    [
        '  ',
        '',
        `${brand.toUpperCase()} https://www.example.com`,
        '',
        `Your ${brand} Login Code`,
        '',
        'Hello,',
        '',
        `Here's your secure 6-digit code to log into ${brand}`,
        '',
        'Verification code',
        '',
        code,
        '',
        "This code will expire in 5 minutes. If you didn't request this, you can safely ignore this email.",
        '',
        'Sincerely,',
        `The ${brand} Team`,
        '',
        'Example Foundation © 2026',
    ].join('\n');
export const loginEmail = (to: string, code: string, brand = 'LearnCard'): EmailOptions => ({
    from: LOGIN_SENDER,
    to,
    subject: `Your ${brand} login code`,
    body: loginBody(code, brand),
});

export const tier12Config: Config = {
    environment: 'staging',
    serverUrl: 'https://api.example.invalid/api',
    tenantId: 'test',
    firebaseApiKey: 'test-api-key',
    keyId: 'test-key',
    authorityGeneration: 'test-generation',
    measurements: [{ pcr0: 'a'.repeat(96), pcr1: 'b'.repeat(96), pcr2: 'c'.repeat(96) }],
    accounts: [0, 1, 2].map(n => ({
        id: `account-${n}`,
        secretArn: `arn:aws:secretsmanager:us-east-1:000000000000:secret:escrow-canary-staging/account-${n}-AbCdEf`,
    })) as Config['accounts'],
};
export const TIER12_EMAIL = 'canary-operator+t12@example.com';

const fakeJwt = (claims: Record<string, unknown>): string =>
    `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.sig`;

interface ServerKey {
    did: string;
    shareVersion: number;
    enrolled: boolean;
    pin: boolean;
    active: boolean;
    optedOut: boolean;
}
interface Version {
    value: string;
    stages: Set<string>;
}

export interface WorldOptions {
    /** lca-api send outcome. `silent`: success but no mail (no Postmark token / CI). */
    send: 'ok' | 'rate_limited' | 'silent' | 'delivery_refused';
    /** Mail arrives but fails a trust check. */
    untrustedMail: boolean;
    mailDelayMs: number;
    rotateRefresh: boolean;
    refreshRejected: boolean;
    enrollResult: 'ok' | 'opted-out';
    /** atomicUpdateShares throws this many times (crash after write-ahead). */
    sharesFailures: number;
    /** The next secret readback returns a tampered value. */
    tamperReadback: boolean;
    /** Logged by the fake SDK on every strategy call (secret leakage probe). */
    sdkLogs: boolean;
}

export class ProvisionWorld {
    now = Date.UTC(2026, 9, 30, 12);
    calls: string[] = [];
    sends = 0;
    verifies = 0;
    keysGenerated = 0;
    out: string[] = [];
    prompts: string[] = [];
    codes = new Map<string, string>();
    users = new Set<string>();
    server = new Map<string, ServerKey>();
    inbox = new Map<string, { lastModified: number; body: string }>();
    secrets = new Map<string, Map<string, Version>>();
    ledger: Ledger & { items: () => unknown[] } = createMemoryLedger();
    options: WorldOptions = {
        send: 'ok',
        untrustedMail: false,
        mailDelayMs: 15_000,
        rotateRefresh: false,
        refreshRejected: false,
        enrollResult: 'ok',
        sharesFailures: 0,
        tamperReadback: false,
        sdkLogs: false,
    };
    private sequence = 0;
    private versionSequence = 0;
    /** Sentinel values that must never appear in output. */
    readonly sentinels = new Set<string>();

    constructor() {
        for (const account of runnerConfig.holdAccounts) this.placeholder(account.secretId);
        for (const account of tier12Config.accounts) this.placeholder(account.secretArn);
    }

    placeholder(secretId: string): void {
        this.secrets.set(
            secretId,
            new Map([['v-initial', { value: '{}', stages: new Set(['AWSCURRENT']) }]])
        );
    }

    /** Put a raw value directly under a stage (operator paste or another run). */
    setStage(secretId: string, stage: string, value: string): string {
        const versions = this.secrets.get(secretId)!;
        for (const version of versions.values()) version.stages.delete(stage);
        this.versionSequence += 1;
        const id = `v-external-${this.versionSequence}`;
        versions.set(id, { value, stages: new Set([stage]) });
        return id;
    }

    stageValue(secretId: string, stage: string): string | undefined {
        for (const version of this.secrets.get(secretId)!.values())
            if (version.stages.has(stage)) return version.value;
        return undefined;
    }

    private labelOf(email: string): string | undefined {
        const match = /\+([0-9]+)@/.exec(email);
        return match && email.startsWith(runnerConfig.inbox.localPart)
            ? holdLabel(Number(match[1]) - 1)
            : undefined;
    }

    private emailOfToken(token: string): string {
        return token.replace(/^token-/, '').replace(/#r[0-9]+$/, '');
    }

    login: LoginClient = {
        sendCode: async email => {
            this.calls.push('send');
            this.sends += 1;
            if (this.options.send === 'rate_limited')
                throw new ProvisionError('send', 'rate_limited');
            if (this.options.send === 'delivery_refused')
                throw new ProvisionError('send', 'delivery_refused');
            this.sequence += 1;
            const code = String(100_000 + ((this.sequence * 7919) % 900_000));
            this.codes.set(email, code);
            this.sentinels.add(code);
            const label = this.labelOf(email);
            if (this.options.send === 'silent' || !label) return;
            const options = loginEmail(email, code);
            this.deliver(
                label,
                this.now + this.options.mailDelayMs,
                this.options.untrustedMail
                    ? {
                          ...options,
                          authResults: `amazonses.com; spf=pass smtp.mailfrom=bounce@${LOGIN_DKIM_DOMAIN}; dkim=pass header.i=@${LOGIN_DKIM_DOMAIN}; dmarc=fail header.from=${LOGIN_DKIM_DOMAIN};`,
                      }
                    : options
            );
        },
        verifyCode: async (email, code) => {
            this.calls.push('verify');
            this.verifies += 1;
            if (this.codes.get(email) !== code) throw new ProvisionError('verify', 'rejected');
            this.codes.delete(email);
            this.users.add(email);
            const custom = `custom-token-${email}`;
            this.sentinels.add(custom);
            return custom;
        },
        exchange: async custom => {
            this.calls.push('exchange');
            const email = custom.replace(/^custom-token-/, '');
            const idToken = fakeJwt({
                iss: `https://securetoken.google.com/${PROJECT}`,
                aud: PROJECT,
                exp: Math.floor(this.now / 1000) + 3600,
                email,
            });
            this.sentinels.add(idToken);
            this.sentinels.add(`refresh-${email}`);
            return { idToken, refreshToken: `refresh-${email}` };
        },
    };

    deliver(label: string, at: number, options: EmailOptions): void {
        this.sequence += 1;
        this.inbox.set(`inbox/${label}/${String(this.sequence).padStart(6, '0')}`, {
            lastModified: at,
            body: buildEmail(options),
        });
    }

    refresh = async (_apiKey: string, refreshToken: string) => {
        this.calls.push('refresh');
        if (this.options.refreshRejected) throw new ProvisionError('refresh', 'auth');
        const email = refreshToken.replace(/^refresh-/, '').replace(/#r[0-9]+$/, '');
        const token = `token-${email}`;
        this.sentinels.add(token);
        const rotated = this.options.rotateRefresh ? `refresh-${email}#r${this.now}` : refreshToken;
        this.sentinels.add(rotated);
        return { token, refreshToken: rotated };
    };

    secretStore: StagedSecretStore = {
        describe: async secretId => {
            const versions = this.secrets.get(secretId);
            if (!versions) throw new Error('ResourceNotFound');
            const name = secretId.startsWith('arn:')
                ? secretId.split(':secret:')[1].replace(/-[A-Za-z0-9]{6}$/, '')
                : secretId;
            return {
                arn: secretId.startsWith('arn:')
                    ? secretId
                    : `arn:aws:secretsmanager:us-east-1:000000000000:secret:${secretId}-AbCdEf`,
                name,
                versions: Object.fromEntries(
                    [...versions.entries()]
                        .filter(([, version]) => version.stages.size > 0)
                        .map(([id, version]) => [id, [...version.stages]])
                ),
            } satisfies SecretMetadata;
        },
        read: async (secretId, ref) => {
            const versions = this.secrets.get(secretId)!;
            const version =
                'versionId' in ref
                    ? versions.get(ref.versionId)
                    : [...versions.values()].find(candidate => candidate.stages.has(ref.stage));
            if (
                version &&
                this.options.tamperReadback &&
                'versionId' in ref &&
                version.stages.has('PROVISIONING')
            ) {
                this.options.tamperReadback = false;
                const parsed = JSON.parse(version.value);
                return JSON.stringify({ ...parsed, recoveryLanguage: 'de' });
            }
            return version?.value;
        },
        putProvisioning: async (secretId, value) => {
            this.calls.push('put');
            const versions = this.secrets.get(secretId)!;
            for (const version of versions.values()) version.stages.delete('PROVISIONING');
            this.versionSequence += 1;
            const id = `v-${this.versionSequence}`;
            versions.set(id, { value, stages: new Set(['PROVISIONING']) });
            return id;
        },
        moveStage: async (secretId, stage, to, from) => {
            this.calls.push(`move:${stage}`);
            const versions = this.secrets.get(secretId)!;
            const holder = [...versions.entries()].find(([, version]) => version.stages.has(stage));
            if (holder && holder[0] !== to && holder[0] !== from)
                throw new Error('InvalidParameter');
            if (from && !versions.get(from)?.stages.has(stage)) throw new Error('InvalidParameter');
            if (from) versions.get(from)!.stages.delete(stage);
            if (to) {
                if (stage === 'AWSCURRENT')
                    for (const version of versions.values()) version.stages.delete('AWSPREVIOUS');
                if (stage === 'AWSCURRENT' && from) versions.get(from)!.stages.add('AWSPREVIOUS');
                versions.get(to)!.stages.add(stage);
            }
        },
    };

    private log(...values: unknown[]): void {
        // Mimics SDK console logging of raw objects (must be contained).
        if (this.options.sdkLogs) console.error('SDK debug', ...values);
    }

    strategy = (storage: SSSStorageFunctions): ProvisionStrategy => {
        const keyOf = (token: string) => this.server.get(this.emailOfToken(token));
        return {
            fetchServerKeyStatus: async token => {
                this.calls.push('status');
                const key = keyOf(token);
                this.log(token, key);
                return {
                    exists: !!key,
                    needsMigration: false,
                    primaryDid: key?.did ?? null,
                    recoveryMethods: [],
                    authShare: key ? 'auth-share' : null,
                    shareVersion: key?.shareVersion ?? null,
                    maskedRecoveryEmail: null,
                    sssActivationState: key ? (key.active ? 'active' : 'provisional') : null,
                } as never;
            },
            atomicUpdateShares: async params => {
                this.calls.push('shares');
                this.log(params);
                if (this.options.sharesFailures > 0) {
                    this.options.sharesFailures -= 1;
                    throw new Error(`transport failure ${params.privateKey}`);
                }
                const email = this.emailOfToken(params.token);
                const existing = this.server.get(email);
                if (existing && existing.did !== params.did) throw new Error('DID conflict');
                this.server.set(email, {
                    did: params.did,
                    shareVersion: 1,
                    enrolled: false,
                    pin: false,
                    active: false,
                    optedOut: false,
                });
                await storage.storeDeviceShare(`device-share-${params.privateKey.slice(0, 6)}`);
                await storage.storeShareVersion(1);
            },
            enableEscrowRecovery: async params => {
                this.calls.push('enroll');
                this.log(params);
                const key = keyOf(params.token)!;
                if (!params.options?.recoveryEmail || params.options.recoveryLanguage !== 'en')
                    throw new Error('missing contact');
                if (this.options.enrollResult === 'opted-out')
                    return { enrolled: false, reason: 'opted-out' };
                if (key.enrolled) return { enrolled: true, changed: false };
                key.enrolled = true;
                key.shareVersion += 1;
                await storage.storeShareVersion(key.shareVersion);
                return { enrolled: true, changed: true, shareVersion: key.shareVersion };
            },
            setEscrowPin: async params => {
                this.calls.push('pin');
                this.log(params);
                const key = keyOf(params.token)!;
                if (!params.options?.recoveryEmail) throw new Error('missing contact');
                this.sentinels.add(params.pin);
                key.enrolled = true;
                key.pin = true;
                key.shareVersion += 1;
                await storage.storeShareVersion(key.shareVersion);
            },
            activate: async (token, _provider, vp) => {
                this.calls.push('activate');
                if (vp !== 'fresh-vp') throw new Error('missing proof');
                keyOf(token)!.active = true;
            },
            getFreshDidAuthVp: async () => 'fresh-vp',
            getEscrowEnrollmentState: async params => {
                const key = keyOf(params.token);
                return {
                    state: key?.enrolled ? 'enrolled' : 'not-enrolled',
                    escrowPin: {
                        state: key?.pin ? 'enabled' : 'none',
                        enabled: !!key?.pin,
                        attemptsRemaining: 5,
                    },
                };
            },
        };
    };

    deps(overrides: Partial<ProvisionDeps> = {}): ProvisionDeps {
        return {
            login: this.login,
            refresh: this.refresh,
            inbox: {
                list: async prefix =>
                    [...this.inbox.entries()]
                        .filter(
                            ([key, value]) =>
                                key.startsWith(prefix) && value.lastModified <= this.now
                        )
                        .map(([key, value]) => ({
                            key,
                            lastModified: value.lastModified,
                            size: value.body.length,
                        })),
                get: async key => new TextEncoder().encode(this.inbox.get(key)!.body),
            },
            secrets: this.secretStore,
            sdk: {
                did: async key => `did:key:z${key.slice(-12)}`,
                sign: async () => 'proof',
                attest: async () => ({ keyId: 'test-key' }) as never,
                authority: async (account, token) => {
                    this.calls.push('authority');
                    const key = this.server.get(this.emailOfToken(token));
                    if (!key || key.did !== account.did)
                        throw new Error('Unexpected authority state');
                    return {
                        status: 'active',
                        hasPin: key.pin,
                        shareVersion: key.shareVersion,
                    } as never;
                },
            },
            strategy: this.strategy,
            prompt: async question => {
                this.prompts.push(question);
                return this.codes.get(TIER12_EMAIL) ?? '';
            },
            randomKey: async () => {
                this.keysGenerated += 1;
                const key = (0xabc000 + this.keysGenerated).toString(16).padStart(64, 'f');
                this.sentinels.add(key);
                return key;
            },
            randomPin: () => {
                const pin = '58273914';
                this.sentinels.add(pin);
                return pin;
            },
            now: () => this.now,
            sleep: async ms => {
                this.now += ms;
            },
            out: line => this.out.push(line),
            ...overrides,
        };
    }

    async plan(
        tier: 1 | 2 | 3,
        labels: string[] = ['hold-01'],
        config: RunnerConfig = runnerConfig
    ): Promise<Plan> {
        const targets: Target[] =
            tier === 3
                ? tier3Targets(config, labels)
                : [
                      tier12Target(
                          tier12Config,
                          tier,
                          tier === 1 ? 'read-only' : labels[0],
                          TIER12_EMAIL
                      ),
                  ];
        const metadata = new Map<string, SecretMetadata>();
        for (const target of targets)
            metadata.set(target.label, await this.secretStore.describe(target.secretId));
        return {
            environment: 'staging',
            tier,
            base: tier12Config,
            runner: tier === 3 ? config : undefined,
            targets,
            metadata,
            ledger: tier === 3 ? this.ledger : undefined,
        };
    }
}

export const defaultOptions: ProvisionOptions = {
    dryRun: false,
    checkMail: false,
    activate: false,
    initPool: false,
    loginMail,
    firebaseProject: PROJECT,
    mailTimeoutMs: 120_000,
    mailPollMs: 10_000,
};
