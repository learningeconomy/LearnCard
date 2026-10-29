import type { InstallIntentView } from '../port';

/**
 * Values passed between steps. Every field starts empty and is filled by the step that
 * `produces` it; a step reads one with `need(ids, 'key')`, which blocks the step when an
 * earlier step failed to produce it.
 */

/** Fixed wallet seeds so every run talks about the same people. */
export const SCENARIO_SEEDS = {
    /** Learner A: the consenting learner (same wallet as prove-demo-learner). */
    learnerA: 'd'.repeat(64),
    /** Learner B: a district member who never consents. */
    learnerB: 'b'.repeat(64),
    /**
     * A wallet that is neither learner (offer-claim negative). Not 'f'*64: that seed is
     * above the secp256k1 group order, and LearnCard's key derivation panics on it.
     */
    otherWallet: '7'.repeat(64),
    /** Publisher key that signs the Demo LMS manifest. */
    publisher: 'e'.repeat(64),
} as const;

/** Brain's SEED for the local stack and the in-process database. */
export const SCENARIO_BRAIN_SEED = 'a';

export const SCENARIO_PROFILE_IDS = {
    learnerA: 'demo-learner',
    learnerB: 'demo-learner-b',
    otherWallet: 'demo-other-wallet',
} as const;

export const ROOT_ECOSYSTEM_ID = 'eco_dev_root';
export const DEMO_LMS_SLUG = 'demo-lms';
export const DEMO_COURSE_ID = 'course-101';

export type WalletRole = keyof typeof SCENARIO_PROFILE_IDS;

export type ScenarioWallet = { role: WalletRole; profileId: string; did: string };

export type ScenarioIssuer = { did: string; groupId: string; profileId: string };

export type ScenarioIds = {
    rootEcosystemId?: string;
    operatorProfileId?: string;
    listingId?: string;
    versionId?: string;
    districtId?: string;
    learnerA?: ScenarioWallet;
    learnerB?: ScenarioWallet;
    otherWallet?: ScenarioWallet;
    issuer?: ScenarioIssuer;
    intentId?: string;
    intent?: InstallIntentView;
    /** False when S04 found an intent already past adoption (live `--district` reuse). */
    freshInstall?: boolean;
    installId?: string;
    serviceAccountId?: string;
    /** Set once the partner (demo LMS or partner client) holds a working credential. */
    partnerReady?: true;
    /** Set once an on-demand probe left the ServiceAccount ENABLED. */
    partnerHealthy?: true;
    contractId?: string;
    contractUri?: string;
    /** The record-provisioning Binding currently ACTIVE (push from S09, offer from S14). */
    bindingId?: string;
    bindingRevision?: number;
    /** S09's push Binding, kept after S14 revokes it. */
    pushBindingId?: string;
    /** S14's offer Binding. */
    offerBindingId?: string;
    termsUri?: string;
    /** The completion S11 submitted; S12 resubmits it for DUPLICATE. */
    completionId?: string;
    recordId?: string;
    credentialUri?: string;
    /** The offer link exactly as the partner showed it (S15). */
    offerUri?: string;
    offerRecordId?: string;
    /** Set once learner A claimed the S15 offer (S16). */
    offerClaimed?: true;
    /** N6's scratch district, whose install is removed to cascade a Binding revoke. */
    cascadeDistrictId?: string;
    /** N6's record Binding, revoked by the install removal (not by an operator). */
    cascadeBindingId?: string;
};

export class BlockedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BlockedError';
    }
}

/** Filled by the runner from the step list: which step produces each id. */
const producers = new Map<keyof ScenarioIds, string>();

export const registerProducers = (
    steps: readonly { id: string; produces: readonly (keyof ScenarioIds)[] }[]
): void => {
    producers.clear();
    for (const step of steps) {
        for (const key of step.produces) if (!producers.has(key)) producers.set(key, step.id);
    }
};

export const producerOf = (key: keyof ScenarioIds): string => producers.get(key) ?? String(key);

export const need = <K extends keyof ScenarioIds>(
    ids: ScenarioIds,
    key: K
): NonNullable<ScenarioIds[K]> => {
    const value = ids[key];
    if (value === undefined || value === null) {
        throw new BlockedError(`needs ${producerOf(key)} (${String(key)})`);
    }
    return value;
};
