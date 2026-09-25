import * as Sentry from '@sentry/serverless';

import type {
    ResolvedTenant,
    TemplateId,
    EscrowHoldCancelledReason,
} from '@learncard/email-templates';
import { resolveBranding } from '@learncard/email-templates';

import type { EscrowHold, MongoUserKeyType } from '@models';
import { getDeliveryService, getFrom, type DeliveryService } from '../delivery';
import { buildEscrowCancelUrl } from '@helpers/escrowCancelLink';

export type EscrowHoldEventKind = 'started' | 'reminder' | 'completed' | 'cancelled' | 'pin-locked';

export interface EscrowHoldEvent {
    kind: EscrowHoldEventKind;
    hold: EscrowHold;
    userKey: MongoUserKeyType;
    reason?: 'superseded';
    /** Plaintext single-use cancel-link token for 'started' events. Never log this. */
    cancelToken?: string;
    /** Tenant for branding/base-URL resolution. Route handlers pass `ctx.tenant`. */
    tenant?: ResolvedTenant;
    /**
     * The account's still-pending waiting-period (`releasePolicy:'hold'`)
     * hold, if one exists. Only read for 'pin-locked': that event's own
     * `hold` (the PIN hold that just got locked) is already terminal by the
     * time it fires, so its cancel link could never work — `activeHold` is
     * the attacker's remaining path, and the one the email copy refers to as
     * "still available".
     */
    activeHold?: EscrowHold;
}

// Referenced only as a type (`typeof import(...)`) so this module never
// eagerly value-imports `pushNotifications.helpers` — that helper's chain
// reaches `@accesslayer/pushtokens`, which touches Mongo at module load and
// would force every unit test in this file onto a live/mocked database.
type SendPushNotification =
    typeof import('@helpers/pushNotifications.helpers').sendPushNotification;

/** Injectable seams for tests. Defaults are the real delivery/push/DB/clock. */
export interface EscrowHoldNotifierDeps {
    send: DeliveryService['send'];
    sendPush: SendPushNotification;
    now: () => Date;
    rotateCancelToken: (holdId: string) => Promise<string | null>;
    recordNotification: (holdId: string, kind: EscrowHoldEventKind) => Promise<void>;
}

// The Mongo-backed defaults are imported lazily, inside each closure, for the
// same reason as the `SendPushNotification` type above: `@models` (like
// `@helpers/pushNotifications.helpers`) value-imports `@mongo`, which throws
// at *module load* unless Mongo test globals are initialized — which unit
// tests here never do. Every test supplies its own `overrides`, so these
// closures (and their dynamic imports) are never actually invoked; only real
// callers (route handlers, which pass no overrides) exercise them.
const defaultDeps: EscrowHoldNotifierDeps = {
    send: notification => getDeliveryService().send(notification),
    sendPush: async notification => {
        const { sendPushNotification } = await import('@helpers/pushNotifications.helpers');
        return sendPushNotification(notification);
    },
    now: () => new Date(),
    rotateCancelToken: async holdId => {
        const { rotateEscrowCancelToken } = await import('@models');
        return rotateEscrowCancelToken(holdId);
    },
    recordNotification: async (holdId, kind) => {
        const { recordEscrowHoldNotification } = await import('@models');
        return recordEscrowHoldNotification(holdId, kind);
    },
};

const EMAIL_TEMPLATE_ALIAS: Record<EscrowHoldEventKind, TemplateId> = {
    started: 'escrow-hold-started',
    reminder: 'escrow-hold-reminder',
    completed: 'escrow-hold-released',
    cancelled: 'escrow-hold-cancelled',
    'pin-locked': 'escrow-pin-locked',
};

const PUSH_MESSAGES: Record<EscrowHoldEventKind, { title: string; body: string }> = {
    started: {
        title: 'Account recovery started',
        body: "If this wasn't you, open the app to cancel.",
    },
    reminder: {
        title: 'Recovery completes tomorrow',
        body: "If this wasn't you, open the app to cancel.",
    },
    completed: {
        title: 'Your account was recovered',
        body: 'Account recovery is complete.',
    },
    cancelled: {
        title: 'Recovery request cancelled',
        body: 'Your account recovery request was cancelled.',
    },
    'pin-locked': {
        title: 'Recovery PIN locked',
        body: 'Your recovery PIN was locked after too many attempts.',
    },
};

/**
 * Mirrors `isRecoveryMethodConfirmed` from `models/UserKey.ts` exactly
 * (grandfathers pre-protocol methods on already-active records; otherwise
 * requires `confirmedAt`). Duplicated rather than imported because that
 * module value-imports `@mongo`, which — like the push helper above — would
 * force every unit test in this file onto a live/mocked database.
 */
const isMethodConfirmed = (
    userKey: MongoUserKeyType,
    method: MongoUserKeyType['recoveryMethods'][number]
): boolean => {
    if (method.confirmedAt) return true;
    if (method.confirmationStatus) return false;
    return (userKey.sssActivationState ?? 'active') === 'active';
};

/**
 * Every verified email address on the account, deduped case-insensitively.
 * `contactMethod` has no separate "verified" flag: it is the login identity
 * itself (proved via Firebase/OTP at signup, e.g. the `login-verification-code`
 * flow), so possession of it IS the verification. `recoveryEmail` is checked
 * against its own `recoveryEmailVerifiedAt` companion field defensively, even
 * though every writer sets both together. `recoveryMethods[]` entries only
 * count once confirmed, so an attacker-added, unconfirmed method can never
 * receive a cancel link for a recovery it started.
 */
const getRecipientEmails = (userKey: MongoUserKeyType): string[] => {
    const candidates: (string | undefined)[] = [
        userKey.contactMethod.type === 'email' ? userKey.contactMethod.value : undefined,
        userKey.recoveryEmail && userKey.recoveryEmailVerifiedAt
            ? userKey.recoveryEmail
            : undefined,
        ...userKey.recoveryMethods
            .filter(method => method.confirmationEmail && isMethodConfirmed(userKey, method))
            .map(method => method.confirmationEmail),
    ];

    const seen = new Set<string>();
    const recipients: string[] = [];
    for (const candidate of candidates) {
        const normalized = candidate?.trim().toLowerCase();
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        recipients.push(normalized);
    }
    return recipients;
};

const mapCancelReason = (hold: EscrowHold): EscrowHoldCancelledReason | undefined => {
    if (hold.cancelReason === 'superseded') return 'superseded';
    if (hold.cancelReason === 'pin-locked') return 'pin-locked';
    if (hold.cancelReason === 'release-failed') return 'release-failed';
    if (hold.cancelledBy === 'did' || hold.cancelledBy === 'link') return 'user';
    return undefined;
};

/**
 * Builds the per-kind email template model, or null when there is nothing
 * sendable (e.g. a reminder whose hold was claimed/cancelled before the
 * scheduler ran, so a fresh cancel token can no longer be issued).
 *
 * 'started' reuses the plaintext token generated at hold creation (never
 * persisted, so it can't be regenerated later). 'reminder' mints a fresh one
 * via `rotateCancelToken` on its own hold, which invalidates any previously
 * issued link for it. 'pin-locked' instead rotates a token on `activeHold`
 * (the account's still-open waiting-period hold, if any) — its own `hold` is
 * already terminal by the time it fires, so a token rotated there could
 * never authorize a cancel; `cancelUrl`/`releaseAfter` are omitted together
 * when there is no still-pending `activeHold`.
 */
const buildEmailTemplateModel = async (
    event: EscrowHoldEvent,
    deps: EscrowHoldNotifierDeps
): Promise<Record<string, unknown> | null> => {
    const { hold } = event;
    const baseUrl = resolveBranding(event.tenant?.emailBranding).appUrl;

    switch (event.kind) {
        case 'started': {
            if (!event.cancelToken) return null;
            return {
                requestedAt: hold.requestedAt.toISOString(),
                releaseAfter: hold.releaseAfter.toISOString(),
                cancelUrl: buildEscrowCancelUrl({
                    baseUrl,
                    holdId: hold._id,
                    token: event.cancelToken,
                }),
            };
        }

        case 'reminder': {
            const token = await deps.rotateCancelToken(hold._id);
            if (!token) return null;
            return {
                releaseAfter: hold.releaseAfter.toISOString(),
                cancelUrl: buildEscrowCancelUrl({ baseUrl, holdId: hold._id, token }),
            };
        }

        case 'completed':
            return { completedAt: (hold.completedAt ?? deps.now()).toISOString() };

        case 'cancelled':
            return {
                cancelledAt: (hold.cancelledAt ?? deps.now()).toISOString(),
                reason: mapCancelReason(hold),
            };

        case 'pin-locked': {
            const { activeHold } = event;
            const token =
                activeHold?.status === 'pending'
                    ? await deps.rotateCancelToken(activeHold._id)
                    : null;
            return {
                lockedAt: deps.now().toISOString(),
                ...(token && activeHold
                    ? {
                          releaseAfter: activeHold.releaseAfter.toISOString(),
                          cancelUrl: buildEscrowCancelUrl({
                              baseUrl,
                              holdId: activeHold._id,
                              token,
                          }),
                      }
                    : {}),
            };
        }
    }
};

/**
 * Never log the recipient address, DID, cancel token, or cancel URL. The
 * underlying error (e.g. a rejected Postmark/FCM call) can itself embed the
 * recipient in its message, so only hold id + kind + channel are recorded —
 * the original error value/message is deliberately dropped, not forwarded.
 */
const logDeliveryFailure = (
    hold: EscrowHold,
    kind: EscrowHoldEventKind,
    channel: 'email' | 'push'
): void => {
    const meta = { holdId: hold._id, kind, channel };
    console.error('[escrow-notifications] delivery failed', meta);
    Sentry.captureException(new Error('Escrow hold notification delivery failed'), { extra: meta });
};

/** Fans an escrow hold lifecycle event out to every verified email address and
 * registered device on the account. Delivery failures are logged (never
 * thrown) so a notification problem can never block the underlying escrow
 * operation. Recorded on the hold once at least one channel succeeds. */
export const notifyEscrowHoldEvent = async (
    event: EscrowHoldEvent,
    overrides: Partial<EscrowHoldNotifierDeps> = {}
): Promise<void> => {
    const deps: EscrowHoldNotifierDeps = { ...defaultDeps, ...overrides };
    const { hold, userKey, kind } = event;
    let delivered = false;

    const recipients = getRecipientEmails(userKey);
    if (recipients.length > 0) {
        const templateModel = await buildEmailTemplateModel(event, deps);
        if (templateModel) {
            const branding = event.tenant?.emailBranding;
            const from = getFrom({ mailbox: 'recovery', branding });
            const results = await Promise.allSettled(
                recipients.map(to =>
                    deps.send({
                        to,
                        templateAlias: EMAIL_TEMPLATE_ALIAS[kind],
                        templateModel,
                        branding,
                        from,
                    })
                )
            );
            for (const result of results) {
                if (result.status === 'fulfilled') delivered = true;
                else logDeliveryFailure(hold, kind, 'email');
            }
        }
    }

    const did = userKey.primaryDid || hold.primaryDid;
    if (did) {
        try {
            const result = await deps.sendPush({
                type: 'APP_NOTIFICATION',
                to: { did },
                from: { did },
                message: PUSH_MESSAGES[kind],
            });
            if (result.successCount > 0) delivered = true;
            if (result.failureCount > 0) logDeliveryFailure(hold, kind, 'push');
        } catch {
            logDeliveryFailure(hold, kind, 'push');
        }
    }

    if (delivered) await deps.recordNotification(hold._id, kind);
};
