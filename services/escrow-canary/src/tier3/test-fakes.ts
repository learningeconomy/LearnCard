/**
 * Test-only fakes for tier 3 (never bundled: nothing in src/handler.ts imports
 * this file). A synthetic escrow "world" with a fake clock, holds, an inbox and
 * SDK strategy methods that follow the documented lca-api/enclave behaviour.
 * All values are synthetic placeholders.
 */
import { createSSSStrategy, EscrowRequestError } from '@learncard/sss-key-manager';
import type { Config } from '../config';
import type { AccountSecret } from '../secrets';
import type { Sdk } from '../sdk';
import { holdLabel, type RunnerConfig } from './config';
import type { InboxObject, InboxStore } from './inbox';
import { DAY, HOUR, MINUTE } from './timing';

export const SENDER = 'recovery@vault.notify.example.com';
export const DKIM_DOMAIN = 'vault.notify.example.com';
export const INBOX_DOMAIN = 'inbox.example.com';
export const INBOX_LOCAL_PART = 'canary-staging';
export const HOLD_MS = 7 * DAY;

export const baseConfig: Config = {
    environment: 'staging',
    serverUrl: 'https://api.example.invalid/api',
    tenantId: 'test',
    firebaseApiKey: 'test-api-key',
    keyId: 'test-key',
    authorityGeneration: 'test-generation',
    measurements: [{ pcr0: 'a'.repeat(96), pcr1: 'b'.repeat(96), pcr2: 'c'.repeat(96) }],
    accounts: [0, 1, 2].map(n => ({
        id: `account-${n}`,
        secretArn: `arn:aws:secretsmanager:us-east-1:000000000000:secret:t12-${n}`,
    })) as Config['accounts'],
};
export const runnerConfig: RunnerConfig = {
    environment: 'staging',
    ledgerTable: 'escrow-canary-staging-tier3',
    poolSize: 12,
    startHourUtc: 15,
    holdDurationMs: HOLD_MS,
    cancelCooldownHours: 48,
    orphanCleanupDelayMs: DAY,
    codePollMs: 6 * MINUTE,
    holdAccounts: Array.from({ length: 12 }, (_, index) => ({
        id: `hold-account-${index + 1}`,
        secretId: `escrow-canary-staging/tier3/hold-account-${index + 1}`,
    })),
    inbox: {
        bucket: 'escrow-canary-staging-inbox-000000000000',
        prefix: 'inbox/',
        domain: INBOX_DOMAIN,
        localPart: INBOX_LOCAL_PART,
        expectedSenders: [SENDER],
        expectedDkimDomain: DKIM_DOMAIN,
        requireDmarc: true,
    },
};

export interface EmailOptions {
    from?: string;
    to: string;
    subject: string;
    body: string;
    authResults?: string | null;
    spam?: string;
    virus?: string;
    /** Extra headers placed ABOVE the SES block (forgery attempt). */
    prepend?: string[];
    /** Extra headers placed in the original message (below the SES block). */
    original?: string[];
    encoding?: '7bit' | 'quoted-printable' | 'base64';
}
export const buildEmail = (options: EmailOptions): string => {
    const from = options.from ?? SENDER;
    const fromDomain = from.split('@')[1];
    const auth =
        options.authResults === null
            ? []
            : [
                  `Authentication-Results: ${
                      options.authResults ??
                      `amazonses.com; spf=pass (spfCheck: domain of amazonses.com designates 192.0.2.1 as permitted sender) smtp.mailfrom=bounce@amazonses.com; dkim=pass header.i=@${fromDomain}; dkim=pass header.i=@amazonses.com; dmarc=pass header.from=${fromDomain};`
                  }`,
              ];
    const body =
        options.encoding === 'base64'
            ? Buffer.from(options.body, 'utf8')
                  .toString('base64')
                  .replace(/(.{76})/g, '$1\r\n')
            : options.encoding === 'quoted-printable'
              ? options.body.replace(/=/g, '=3D').replace(/(.{70})/g, '$1=\r\n')
              : options.body;
    return [
        ...(options.prepend ?? []),
        'Return-Path: <bounce@amazonses.com>',
        `Received: from a1-1.smtp-out.amazonses.com (a1-1.smtp-out.amazonses.com [192.0.2.1])`,
        ` by inbound-smtp.us-east-1.amazonaws.com with SMTP id test for ${options.to};`,
        ' Fri, 30 Oct 2026 12:00:00 +0000 (UTC)',
        `X-SES-Spam-Verdict: ${options.spam ?? 'PASS'}`,
        `X-SES-Virus-Verdict: ${options.virus ?? 'PASS'}`,
        'Received-SPF: pass (spfCheck: synthetic) client-ip=192.0.2.1;',
        ...auth,
        'X-SES-RECEIPT: synthetic',
        `DKIM-Signature: v=1; a=rsa-sha256; d=${fromDomain}; s=synthetic; b=synthetic`,
        `From: ${from}`,
        `To: ${options.to}`,
        `Subject: ${options.subject}`,
        ...(options.original ?? []),
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        `Content-Transfer-Encoding: ${options.encoding ?? '7bit'}`,
        '',
        body,
    ].join('\r\n');
};
export const codeEmail = (to: string, code: string, brand = 'LearnCard'): EmailOptions => ({
    to,
    subject: `Your ${brand} recovery code`,
    body: `Your ${brand} recovery code is: ${code}\n\nOnly enter this code if you started this recovery. If you didn't, ignore this email. Your account stays safe.`,
});
export const warningEmail = (to: string, hours = 24, brand = 'LearnCard'): EmailOptions => ({
    to,
    subject: `Your ${brand} recovery completes soon`,
    body: `Your ${brand} account recovery will complete in about ${hours} hours unless you cancel it.\n\nIf you didn't start this, open the ${brand} app and cancel the recovery right away.`,
});
export const startedEmail = (to: string, brand = 'LearnCard'): EmailOptions => ({
    to,
    subject: `Your ${brand} account recovery has started`,
    body: `Account recovery has started for your ${brand} account.\n\nIf you didn't start this, open the ${brand} app and cancel the recovery right away.`,
});

export const emailFor = (index: number): string =>
    `${INBOX_LOCAL_PART}+${index + 1}@${INBOX_DOMAIN}`;
export const didFor = (label: string): string => `did:key:z${label.replace('-', '')}`;
export const keyFor = (index: number): string => (index + 1).toString(16).padStart(64, '0');

export const makeSecret = (index: number): AccountSecret => ({
    accountId: runnerConfig.holdAccounts[index].id,
    privateKey: keyFor(index),
    did: didFor(holdLabel(index)),
    pin: '738195',
    refreshToken: `refresh-${holdLabel(index)}`,
    recoveryEmail: emailFor(index),
    recoveryLanguage: 'en',
    deviceState: { shares: {}, versions: {} },
});

interface FakeHold {
    label: string;
    holdId: string;
    resumeToken: string;
    code: string;
    status: 'pending' | 'cancelled' | 'completed';
    requestedAt: number;
    confirmedAt?: number;
    releaseAfter: number;
    warnedAt?: number;
    guesses: number;
}

export interface WorldOptions {
    emailDelayMs: number;
    warningDelayMs: number;
    /** lca-api saves the recomputed deadline this long after the warning email. */
    deadlineWriteLagMs: number;
    suppressCodeEmail: boolean;
    suppressWarning: boolean;
    earlyRelease: boolean;
    reenrol: boolean;
    authorityOk: boolean;
    /** Next N release attempts return the enclave's Unavailable (412). */
    unavailable: number;
    startError?: Error;
    codeSent: boolean;
    reportExistingHold: boolean;
    cancelIgnored: boolean;
    refreshRejected: Set<string>;
    rotateRefresh: boolean;
    wrongDid: boolean;
    throwOnRelease?: Error;
}

export class World {
    now: number;
    holds: FakeHold[] = [];
    inbox = new Map<string, { lastModified: number; body: string }>();
    secrets = new Map<string, AccountSecret>();
    secretWrites: AccountSecret[] = [];
    calls: string[] = [];
    options: WorldOptions = {
        emailDelayMs: 20_000,
        warningDelayMs: 30 * MINUTE,
        deadlineWriteLagMs: 0,
        suppressCodeEmail: false,
        suppressWarning: false,
        earlyRelease: false,
        reenrol: true,
        authorityOk: true,
        unavailable: 0,
        codeSent: true,
        reportExistingHold: false,
        cancelIgnored: false,
        refreshRejected: new Set(),
        rotateRefresh: false,
        wrongDid: false,
    };
    private sequence = 0;

    constructor(start: number) {
        this.now = start;
        runnerConfig.holdAccounts.forEach((account, index) =>
            this.secrets.set(account.secretId, makeSecret(index))
        );
    }

    secretOf(label: string): AccountSecret {
        const index = Number(label.slice(5)) - 1;
        return this.secrets.get(runnerConfig.holdAccounts[index].secretId)!;
    }

    deliver(label: string, at: number, options: EmailOptions): string {
        this.sequence += 1;
        const key = `inbox/${label}/${String(this.sequence).padStart(6, '0')}`;
        this.inbox.set(key, { lastModified: at, body: buildEmail(options) });
        return key;
    }

    /** lca-api's hourly warning job + the enclave's warning email. */
    private warnings(): void {
        for (const hold of this.holds) {
            if (
                hold.status !== 'pending' ||
                hold.confirmedAt === undefined ||
                hold.warnedAt !== undefined
            )
                continue;
            const due = hold.confirmedAt + 6 * DAY + this.options.warningDelayMs;
            if (this.now < due) continue;
            hold.warnedAt = due;
            if (!this.options.suppressWarning)
                this.deliver(
                    hold.label,
                    due + this.options.emailDelayMs,
                    warningEmail(this.secretOf(hold.label).recoveryEmail)
                );
        }
    }

    releaseAfterOf(hold: FakeHold): number {
        if (
            hold.warnedAt === undefined ||
            this.now < hold.warnedAt + this.options.deadlineWriteLagMs
        )
            return hold.releaseAfter;
        return Math.max(hold.releaseAfter, hold.warnedAt + DAY + MINUTE);
    }

    advance(ms: number): void {
        this.now += ms;
        this.warnings();
    }

    store: InboxStore = {
        list: async prefix =>
            [...this.inbox.entries()]
                .filter(([key, value]) => key.startsWith(prefix) && value.lastModified <= this.now)
                .map(([key, value]): InboxObject => ({
                    key,
                    lastModified: value.lastModified,
                    size: value.body.length,
                })),
        get: async key => new TextEncoder().encode(this.inbox.get(key)!.body),
    };

    secretStore = {
        read: async (id: string) => structuredClone(this.secrets.get(id)!),
        write: async (id: string, value: AccountSecret) => {
            this.secrets.set(id, structuredClone(value));
            this.secretWrites.push(structuredClone(value));
        },
    };

    refresh = async (_key: string, refreshToken: string) => {
        const label = refreshToken.replace(/^refresh-/, '').replace(/-r\d+$/, '');
        if (this.options.refreshRejected.has(label)) {
            const { RunnerAuthError } = await import('../auth');
            throw new RunnerAuthError();
        }
        return {
            token: `token-${label}`,
            refreshToken: this.options.rotateRefresh
                ? `refresh-${label}-r${this.now}`
                : refreshToken,
        };
    };

    private holdById(holdId: string, resumeToken: string): FakeHold {
        const hold = this.holds.find(candidate => candidate.holdId === holdId);
        if (!hold || hold.resumeToken !== resumeToken) throw new EscrowRequestError(403);
        return hold;
    }

    private status(hold: FakeHold) {
        return {
            holdId: hold.holdId,
            status: hold.status,
            requestedAt: new Date(hold.requestedAt).toISOString(),
            releaseAfter: new Date(this.releaseAfterOf(hold)).toISOString(),
            releasePolicy: 'hold' as const,
            requiresConfirmation: true,
            confirmed: hold.confirmedAt !== undefined,
            holdRecord: { holdDurationMs: HOLD_MS } as never,
        };
    }

    sdk: Sdk = {
        attest: async () => ({
            publicKey: 'key',
            keyId: 'test-key',
            previousKeyIds: [],
            mode: 'nitro' as const,
            authority: { ledgerPublicKey: 'ledger', measurement: 'measurement' },
        }),
        authority: async account => {
            this.calls.push('authority');
            if (!this.options.authorityOk) throw new Error('Unexpected authority state');
            return { did: account.did, status: 'active' } as never;
        },
        did: async key => {
            const index = Number.parseInt(key, 16) - 1;
            return didFor(holdLabel(index));
        },
        sign: async () => 'proof',
        strategy: storage => {
            const strategy = createSSSStrategy({ serverUrl: baseConfig.serverUrl, storage });
            const labelOf = (token: string) => token.replace(/^token-/, '');
            strategy.startEscrowRecovery = async params => {
                this.calls.push('start');
                if (this.options.startError) throw this.options.startError;
                const label = labelOf(params.token!);
                const pending = this.holds.find(
                    hold => hold.label === label && hold.status === 'pending'
                );
                if (pending || this.options.reportExistingHold)
                    return {
                        holdId: pending?.holdId ?? 'hold-id-existing',
                        status: 'pending',
                        requestedAt: new Date(this.now).toISOString(),
                        releaseAfter: new Date(this.now + HOLD_MS).toISOString(),
                        resumeToken: null,
                    } as never;
                this.sequence += 1;
                const hold: FakeHold = {
                    label,
                    holdId: `hold-id-${this.sequence}`,
                    resumeToken: `resume-secret-${this.sequence}`,
                    code: String(10_000_000 + this.sequence * 7919).slice(-8),
                    status: 'pending',
                    requestedAt: this.now,
                    releaseAfter: this.now + HOLD_MS + MINUTE,
                    guesses: 0,
                };
                this.holds.push(hold);
                if (!this.options.suppressCodeEmail)
                    this.deliver(
                        label,
                        this.now + this.options.emailDelayMs,
                        codeEmail(this.secretOf(label).recoveryEmail, hold.code)
                    );
                return {
                    ...this.status(hold),
                    resumeToken: hold.resumeToken,
                    clientEphemeralPrivateKey: 'ephemeral-secret-key',
                    codeSent: this.options.codeSent,
                    expectations: {
                        tenant: 'test',
                        did: params.expectedDid!,
                        holdId: hold.holdId,
                        clientEphemeralPublicKey: 'pub',
                        blobHash: 'blob',
                        authorityGeneration: 'test-generation',
                        holdDigest: 'digest',
                        ledgerPublicKey: 'ledger',
                        keyId: 'test-key',
                    },
                } as never;
            };
            strategy.confirmEscrowRecovery = async params => {
                this.calls.push('confirm');
                const hold = this.holdById(params.holdId, params.resumeToken);
                if (hold.confirmedAt !== undefined) return { success: true };
                hold.guesses += 1;
                if (hold.guesses > 5) throw new EscrowRequestError(403, 'codeLocked');
                if (this.now > hold.requestedAt + 30 * MINUTE)
                    throw new EscrowRequestError(403, 'codeExpired');
                if (params.code !== hold.code) throw new EscrowRequestError(403, 'codeMismatch');
                hold.confirmedAt = this.now;
                hold.releaseAfter = this.now + HOLD_MS + MINUTE;
                return { success: true };
            };
            strategy.getEscrowRecoveryStatus = async params => {
                this.calls.push('status');
                if (!('holdId' in params)) throw new Error('unexpected');
                return this.status(this.holdById(params.holdId, params.resumeToken));
            };
            strategy.cancelEscrowRecovery = async params => {
                this.calls.push('cancel');
                const label = labelOf(params.token);
                const pending = this.holds.find(
                    hold => hold.label === label && hold.status === 'pending'
                );
                if (!pending || this.options.cancelIgnored) return { cancelled: false };
                pending.status = 'cancelled';
                return { cancelled: true };
            };
            strategy.executeRecovery = async params => {
                this.calls.push('release');
                if (params.input.method !== 'escrow') throw new Error('unexpected');
                if (this.options.throwOnRelease) throw this.options.throwOnRelease;
                const hold = this.holdById(params.input.holdId, params.input.resumeToken);
                if (hold.status !== 'pending') throw new EscrowRequestError(403);
                if (this.now < this.releaseAfterOf(hold) && !this.options.earlyRelease)
                    throw new EscrowRequestError(403);
                if (this.options.unavailable > 0) {
                    this.options.unavailable -= 1;
                    throw new EscrowRequestError(412);
                }
                if (!params.options?.recoveryEmail) throw new Error('missing recovery contact');
                hold.status = 'completed';
                await storage.storeDeviceShare(`rotated-share-${this.now}`);
                await storage.storeShareVersion(2);
                const index = Number(hold.label.slice(5)) - 1;
                return {
                    privateKey: keyFor(index),
                    did: this.options.wrongDid ? 'did:key:zwrong' : didFor(hold.label),
                    escrowEnrolled: this.options.reenrol,
                };
            };
            return strategy;
        },
    };
}

export const HOUR_MS = HOUR;
