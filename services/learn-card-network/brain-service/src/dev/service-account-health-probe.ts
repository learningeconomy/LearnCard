/**
 * Dev-only: run one integration health probe now instead of waiting for the reconciler's
 * health sweep (5 minutes by default). No route exposes this; the scenario runner and
 * tests call it in-process. It refuses NODE_ENV=production.
 *
 * `reconcileInstallIntent` silently returns the intent unchanged when a guard stops it
 * (kill switch, intent not approved, policy suspension, backoff, lock or tenant slot
 * held), and in REMOVING/REMOVED it runs or skips removal instead of probing. This module
 * checks those guards first and names the one that applies, so a caller never mistakes
 * "not probed" for "probed and unchanged".
 */
import { environment, getDevToolsRuntimeEnvironment } from '@environment';
import { readInstallIntentById } from '@accesslayer/install-intent/intent-read';
import {
    listInstallTargetsByIntentId,
    readInstallTargetInternal,
} from '@accesslayer/install-target/internal';
import { ServiceAccount, type StoredServiceAccount } from '@models';
import {
    getInstallIntentReconcilerMetricsSnapshot,
    getInstallIntentReconcilerOperatorControls,
    reconcileInstallIntent,
} from '@reconciler';

export type HealthProbeBlocker =
    | 'REVOKED'
    | 'OPERATOR_DISABLED'
    | 'INVARIANT_DISABLED'
    | 'NO_ACTIVE_INSTALL'
    | 'KILL_SWITCH'
    | 'INTENT_NOT_APPROVED'
    | 'POLICY_SUSPENDED'
    | 'REMOVING'
    | 'BACKOFF'
    | 'LOCK_HELD';

export type HealthProbeTarget = { intentId: string } | { serviceAccountId: string };

export type HealthProbeResult = {
    serviceAccountId: string;
    intentId: string;
    status: StoredServiceAccount['status'];
    enableCause?: string;
    disabledCause?: string;
    healthFailures: number;
    credentialGeneration: number;
    /** Set when a guard stopped the probe; the account fields are its unchanged state. */
    blockedBy?: HealthProbeBlocker;
    blockedDetail?: string;
};

const LOCK_ATTEMPTS = 3;
const LOCK_RETRY_MS = 250;

export const assertDevOnly = (): void => {
    if (
        environment.NODE_ENV === 'production' ||
        getDevToolsRuntimeEnvironment().NODE_ENV === 'production'
    ) {
        throw new Error(
            'service-account-health-probe is dev-only and refuses NODE_ENV=production.'
        );
    }
};

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const toResult = (
    account: StoredServiceAccount,
    intentId: string,
    blocked?: { blockedBy: HealthProbeBlocker; blockedDetail: string }
): HealthProbeResult => ({
    serviceAccountId: account.id,
    intentId,
    status: account.status,
    enableCause: account.enableCause,
    disabledCause: account.disabledCause,
    healthFailures: account.healthFailures ?? 0,
    credentialGeneration: account.credentialGeneration,
    ...blocked,
});

const readAccount = async (id: string): Promise<StoredServiceAccount> => {
    const account = await ServiceAccount.findOne({ where: { id }, plain: true });
    if (!account) throw new Error(`ServiceAccount ${id} not found.`);
    return account;
};

const intentIdForInstall = async (installId: string): Promise<string | undefined> => {
    const install = await readInstallTargetInternal({
        id: installId,
        targetType: 'INTEGRATION_INSTALL',
    });
    return install?.intentId;
};

/** Resolves both ends: the intent to reconcile and the account to report on. */
const resolveTarget = async (
    target: HealthProbeTarget
): Promise<{ intentId?: string; account: StoredServiceAccount }> => {
    if ('serviceAccountId' in target) {
        const account = await readAccount(target.serviceAccountId);
        if (!account.activeInstallId) return { account };
        const intentId = await intentIdForInstall(account.activeInstallId);
        return { intentId, account };
    }

    const installs = (await listInstallTargetsByIntentId(target.intentId)).filter(
        candidate => candidate.targetType === 'INTEGRATION_INSTALL'
    );
    for (const install of installs) {
        const account = await ServiceAccount.findOne({
            where: { activeInstallId: install.id },
            plain: true,
        });
        if (account) return { intentId: target.intentId, account };
    }
    throw new Error(`Install intent ${target.intentId} has no active ServiceAccount.`);
};

const accountGuard = (
    account: StoredServiceAccount
): { blockedBy: HealthProbeBlocker; blockedDetail: string } | undefined => {
    if (account.status === 'REVOKED') {
        return { blockedBy: 'REVOKED', blockedDetail: 'The ServiceAccount is revoked.' };
    }
    if (account.status === 'DISABLED' && account.disabledCause !== 'HEALTH') {
        const blockedBy: HealthProbeBlocker =
            account.disabledCause === 'INVARIANT' ? 'INVARIANT_DISABLED' : 'OPERATOR_DISABLED';
        return {
            blockedBy,
            blockedDetail: `Disabled with cause ${account.disabledCause ?? 'unknown'}; health probes never recover it.`,
        };
    }
    return undefined;
};

const intentGuard = async (
    intentId: string
): Promise<{ blockedBy: HealthProbeBlocker; blockedDetail: string } | undefined> => {
    const intent = await readInstallIntentById(intentId);
    if (!intent) throw new Error(`Install intent ${intentId} not found.`);

    const controls = await getInstallIntentReconcilerOperatorControls(intent.ecosystemId);
    if (controls.effectiveKillSwitchEnabled) {
        return {
            blockedBy: 'KILL_SWITCH',
            blockedDetail: controls.globalKillSwitchEnabled
                ? 'The global reconciler kill switch is engaged.'
                : `The reconciler kill switch is engaged for ${intent.ecosystemId}.`,
        };
    }
    if (!intent.spec || intent.approval.state !== 'APPROVED' || !intent.status) {
        return {
            blockedBy: 'INTENT_NOT_APPROVED',
            blockedDetail: `Intent approval is ${intent.approval.state}${intent.status ? '' : ' with no status'}.`,
        };
    }
    if (intent.status.phase === 'SUSPENDED' && intent.status.cause === 'POLICY') {
        return { blockedBy: 'POLICY_SUSPENDED', blockedDetail: 'The intent is policy-suspended.' };
    }
    // A 'health' reconcile of a REMOVING intent runs the remove pass, and of a REMOVED one
    // returns without probing; neither is a health probe.
    if (intent.status.phase === 'REMOVING' || intent.status.phase === 'REMOVED') {
        return {
            blockedBy: 'REMOVING',
            blockedDetail: `The intent is ${intent.status.phase}; a health reconcile would not probe.`,
        };
    }
    if (intent.status.nextAttemptAt && new Date(intent.status.nextAttemptAt) > new Date()) {
        return {
            blockedBy: 'BACKOFF',
            blockedDetail: `The intent is in retry backoff until ${intent.status.nextAttemptAt}.`,
        };
    }
    return undefined;
};

/**
 * Probes one integration's health now via `reconcileInstallIntent(intentId, { operation:
 * 'health' })` and reads back the ServiceAccount. Never passes `now`: the reconciler
 * stamps it into `observedAt`.
 */
export const probeServiceAccountHealthNow = async (
    target: HealthProbeTarget
): Promise<HealthProbeResult> => {
    assertDevOnly();

    const { intentId, account } = await resolveTarget(target);
    if (!intentId) {
        return toResult(account, '', {
            blockedBy: 'NO_ACTIVE_INSTALL',
            blockedDetail: 'The ServiceAccount has no active install.',
        });
    }

    const blocked = accountGuard(account) ?? (await intentGuard(intentId));
    if (blocked) return toResult(account, intentId, blocked);

    for (let attempt = 1; attempt <= LOCK_ATTEMPTS; attempt++) {
        const stuckBefore = getInstallIntentReconcilerMetricsSnapshot().stuck;
        await reconcileInstallIntent(intentId, { operation: 'health' });
        // The guards above were clear, so a new 'stuck' sample means the tenant slot or
        // the intent lock was held by another reconcile.
        if (getInstallIntentReconcilerMetricsSnapshot().stuck === stuckBefore) {
            return toResult(await readAccount(account.id), intentId);
        }
        if (attempt < LOCK_ATTEMPTS) await sleep(LOCK_RETRY_MS * attempt);
    }

    return toResult(await readAccount(account.id), intentId, {
        blockedBy: 'LOCK_HELD',
        blockedDetail: `The intent lock or tenant slot stayed held for ${LOCK_ATTEMPTS} attempts.`,
    });
};
