/**
 * Dev-only console globals for the Pathways v0.5 demo loop.
 *
 * Rather than build a dedicated dev-panel UI (a whole component tree that
 * nobody will look at outside of a demo), we expose the three useful
 * commands on `window.__pathwaysDev` behind `import.meta.env.DEV`. The
 * install is idempotent; calling it twice does nothing on the second pass.
 *
 * Typical demo flow from a fresh clone:
 *
 *   1. `pnpm lc dev ... full`                             — bring up services
 *   2. `pnpm lc` → Seed Test Data → Pathways demo bundle  — seed 3 listings
 *   3. In the browser console on `/pathways`:
 *        __pathwaysDev.seedAws('did:key:...')             — author the pathway
 *        __pathwaysDev.dropVc()                           — drop a matching VC
 *      Watch the proposal appear in the Proposals tab. Accept it. The
 *      `credential-received` outcome binding lights up.
 *
 * The VC drop helper is deliberately minimal: it fabricates the smallest
 * VC that will satisfy each outcome's predicate. We're not simulating a
 * real wallet-observer here; we're confirming the binder → proposal →
 * commit path fires end-to-end without needing a real issuer.
 */

import { v4 as uuid } from 'uuid';

import { pathwayStore, proposalStore } from '../../../stores/pathways';
import { bindCredentialToOutcomes } from '../agents/credentialBinder';
import type { VcLike } from '../core/outcomeMatcher';
import { pathwayProgressReactor } from '../events/pathwayProgressReactor';
import type { ProgressDispatchRecord } from '../events/pathwayProgressReactor';
import { publishWalletEvent } from '../events/walletEventBus';
import type {
    CredentialIngestSource,
    OutcomeSignal,
    Termination,
} from '../types';

import {
    seedAwsCloudPractitionerDemo,
    seedDemoPathwayIfEmpty,
} from './devSeed';

// ---------------------------------------------------------------------------
// VC synthesis
// ---------------------------------------------------------------------------

/**
 * Build a minimal VC that satisfies an OutcomeSignal's predicate. This is
 * the smallest shape the `outcomeMatcher` will accept for each kind —
 * enough to exercise the full binder pipeline, nothing more. For kinds
 * the matcher marks `pending-implementation` (`wage-delta`), we return
 * `null` and the caller skips that signal.
 *
 * Issuer DID is overridable so you can test the trust-tier gate: pass a
 * DID that isn't in the registry and the binder will skip with
 * `trust-too-low` instead of emitting a proposal.
 */
const synthesizeVcForOutcome = (
    outcome: OutcomeSignal,
    issuer = 'did:example:demo-institution',
): VcLike | null => {
    switch (outcome.kind) {
        case 'credential-received':
            return {
                type: ['VerifiableCredential', outcome.expectedCredentialType],
                issuer: outcome.expectedIssuerDid ?? issuer,
                issuanceDate: new Date().toISOString(),
            };

        case 'score-threshold':
            // Build a VC that clears the threshold by a hair — enough to
            // match, not so much that it looks like a hand-edit.
            return {
                type: ['VerifiableCredential', outcome.expectedCredentialType],
                issuer: outcome.expectedIssuerDid ?? issuer,
                issuanceDate: new Date().toISOString(),
                credentialSubject: setFieldPath(
                    {},
                    outcome.field,
                    pickSatisfyingNumber(outcome.op, outcome.value),
                ),
            };

        case 'enrollment':
            return {
                type: ['VerifiableCredential', 'EnrollmentCredential'],
                issuer,
                issuanceDate: new Date().toISOString(),
                credentialSubject: outcome.institutionHint
                    ? { institution: { name: outcome.institutionHint } }
                    : {},
            };

        case 'employment':
            return {
                type: ['VerifiableCredential', 'EmploymentCredential'],
                issuer,
                issuanceDate: new Date().toISOString(),
                credentialSubject: outcome.employerHint
                    ? { employer: { name: outcome.employerHint } }
                    : {},
            };

        case 'wage-delta':
        case 'self-reported':
            // wage-delta: matcher is gated pending a trusted payroll roster.
            // self-reported: a human has to attest; there's no VC to drop.
            return null;
    }
};

/**
 * Dot-path writer — mirror of the matcher's reader. Mutates and returns
 * the root so the caller can chain.
 */
const setFieldPath = (
    root: Record<string, unknown>,
    path: string,
    value: unknown,
): Record<string, unknown> => {
    const segments = path.split('.').filter(Boolean);

    if (segments.length === 0) return root;

    let cursor: Record<string, unknown> = root;

    for (let i = 0; i < segments.length - 1; i += 1) {
        const key = segments[i];
        const next = cursor[key];

        if (next && typeof next === 'object' && !Array.isArray(next)) {
            cursor = next as Record<string, unknown>;
        } else {
            const fresh: Record<string, unknown> = {};
            cursor[key] = fresh;
            cursor = fresh;
        }
    }

    cursor[segments[segments.length - 1]] = value;

    return root;
};

/**
 * Pick a number that satisfies the given comparison against `value`.
 * Stays a hair above `>=` / `>`, equal for `==`, a hair below for `<=` / `<`.
 */
const pickSatisfyingNumber = (
    op: '==' | '!=' | '<' | '<=' | '>' | '>=',
    value: number,
): number => {
    switch (op) {
        case '==':
            return value;
        case '!=':
            return value + 1;
        case '>':
            return value + 1;
        case '>=':
            return value;
        case '<':
            return value - 1;
        case '<=':
            return value;
    }
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

interface DropVcOptions {
    /** Override the pathway targeted. Defaults to the active pathway. */
    pathwayId?: string;
    /** Override the issuer DID on the synthesized VC. */
    issuer?: string;
}

interface DropVcResult {
    proposalsEmitted: number;
    skipped: Array<{ pathwayId: string; outcomeId: string; reason: string }>;
}

/**
 * Synthesize a VC that matches each outcome on the active pathway and
 * run the credential binder. Emitted proposals land in `proposalStore`
 * just like an agent-origin proposal would; the learner accepts through
 * the normal Proposals tab.
 *
 * Prints a summary to the console so the demo has a narratable beat.
 */
const dropMatchingDemoVc = (options: DropVcOptions = {}): DropVcResult => {
    const activeId = options.pathwayId ?? pathwayStore.get.activePathwayId();

    if (!activeId) {
        console.warn('[pathwaysDev] No active pathway — seed one first.');

        return { proposalsEmitted: 0, skipped: [] };
    }

    const pathway = pathwayStore.get.pathways()[activeId];

    if (!pathway) {
        console.warn(`[pathwaysDev] Active pathway "${activeId}" not in the store.`);

        return { proposalsEmitted: 0, skipped: [] };
    }

    const outcomes = pathway.outcomes ?? [];

    if (outcomes.length === 0) {
        console.warn(`[pathwaysDev] Pathway "${pathway.title}" has no outcomes to match against.`);

        return { proposalsEmitted: 0, skipped: [] };
    }

    let proposalsEmitted = 0;
    const allSkipped: DropVcResult['skipped'] = [];

    for (const outcome of outcomes) {
        const vc = synthesizeVcForOutcome(outcome, options.issuer);

        if (!vc) {
            console.info(
                `[pathwaysDev] Skipping outcome "${outcome.label}" — kind "${outcome.kind}" has no VC shape to synthesize.`,
            );

            continue;
        }

        // Use a fresh urn per synthesis so repeated calls don't collide
        // with the binder's "already-bound" short-circuit.
        const credentialUri = `urn:uuid:demo-${uuid()}`;

        const { proposals, skipped } = bindCredentialToOutcomes({
            vc,
            credentialUri,
            pathways: [pathway],
            ownerDid: pathway.ownerDid,
            // A permissive trust registry so the demo doesn't dead-end on
            // trust-tier skips. Real code path uses a real registry.
            trustRegistry: {
                institutionIssuers: new Set([
                    (typeof vc.issuer === 'string' ? vc.issuer : vc.issuer?.id) ?? '',
                ]),
            },
        });

        for (const proposal of proposals) {
            // NOTE: Not firing `PATHWAYS_OUTCOME_AUTOBIND_PROPOSED` here
            // because the analytics client is hook-only and this helper
            // runs outside React. The accept-proposal path fires
            // `PATHWAYS_OUTCOME_BOUND` through the normal component tree,
            // which is the event that actually matters for the demo.
            proposalStore.set.addProposal(proposal);
            proposalsEmitted += 1;
        }

        allSkipped.push(...skipped.map(s => ({ ...s, reason: String(s.reason) })));
    }

    console.info(
        `[pathwaysDev] Dropped demo VC → ${proposalsEmitted} proposal(s) emitted, ${allSkipped.length} skip(s).`,
        { skipped: allSkipped },
    );

    return { proposalsEmitted, skipped: allSkipped };
};

// ---------------------------------------------------------------------------
// Wallet-event simulators (for the pathway-progress reactor)
// ---------------------------------------------------------------------------
//
// These simulators are the primary test scaffolding for the post-v0.5
// pathway-progress architecture (credential-ingested /
// ai-session-completed → bus → reactor → binder → proposal →
// auto-accept → pathway state + CTA modal).
//
// They publish *through the bus* rather than poking the reactor
// directly so the full pipeline runs — dedup, replay buffer,
// fanout, binder, proposal store, auto-accept. The return value is
// the dispatch record the reactor recorded for the event, so a
// console user can see exactly what the pipeline did.
//
// Two design choices worth flagging:
//
//   1. **Simulators assemble real-shaped events.** We populate the
//      same fields production ingests would (eventId, credentialUri,
//      a VC body the identity extractor can walk). That way the
//      simulator exercises the identity-extraction chain too, not
//      just the match layer.
//
//   2. **Every helper is idempotent on eventId.** Pass your own
//      eventId to test the dedup layer; omit it and the simulator
//      mints a fresh uuid for every call.

/**
 * Input shape for `simulateCredentialClaim`. Every field is optional;
 * pass whatever the termination you're trying to satisfy is looking
 * for. The simulator assembles a minimal VC body from these inputs
 * that the identity extractor can traverse.
 */
export interface SimulateCredentialInput {
    /**
     * W3C `type` string (e.g. `'AWSCertifiedCloudPractitioner'`).
     * The VC's type array will be `['VerifiableCredential', type]`.
     */
    type?: string;
    /** Issuer DID. Defaults to `did:example:demo-issuer`. */
    issuer?: string;
    /** W3C `id` field — for `issuer-credential-id` matchers. */
    credentialId?: string;
    /**
     * LearnCard boost URI forwarded as a publisher provenance hint —
     * the identity extractor pins it on the `CredentialIdentity` so
     * `boost-uri` matchers fire regardless of VC body.
     */
    boostUri?: string;
    /**
     * OBv3 `credentialSubject.achievement.id`. For
     * `ob-achievement` matchers.
     */
    achievementId?: string;
    /**
     * OBv3 alignments — each becomes a `targetUrl` on the
     * achievement's `alignments[]` array. For `ob-alignment` matchers.
     */
    alignments?: string[];
    /**
     * Skill tags — populated into `credentialSubject.tag`. For
     * `skill-tag` matchers.
     */
    tags?: string[];
    /**
     * Extra `credentialSubject` fields merged verbatim. For
     * `score-threshold` matchers; e.g.
     * `{ score: { total: 1450 } }`.
     */
    credentialSubject?: Record<string, unknown>;
    /** Ingest source tag. Defaults to `'import'`. */
    source?: CredentialIngestSource;
    /** Override for dedup testing. Defaults to a fresh uuid. */
    eventId?: string;
    /** Override for dedup testing. Defaults to a fresh `urn:uuid:`. */
    credentialUri?: string;
}

/**
 * Publish a synthetic `CredentialIngested` event to the wallet
 * event bus. The reactor (if mounted) will pick it up, run the
 * binders, write proposals, and auto-accept — same path as a real
 * claim. Returns the reactor's dispatch record so the console user
 * can see what matched.
 *
 * Call after `seedAws(did)` so there's a pathway to match against.
 */
const simulateCredentialClaim = (
    input: SimulateCredentialInput = {},
): ProgressDispatchRecord | null => {
    const eventId = input.eventId ?? uuid();
    const credentialUri = input.credentialUri ?? `urn:uuid:sim-${uuid()}`;

    // Assemble a minimal-but-realistic VC body. The identity
    // extractor pulls from `type`, `issuer`, `id`, subject.tag,
    // subject.achievement.{id,alignments}, and various ctid fields;
    // we populate the ones that correspond to supplied input.
    const achievement: Record<string, unknown> = {};

    if (input.achievementId) achievement.id = input.achievementId;
    if (input.alignments && input.alignments.length > 0) {
        achievement.alignments = input.alignments.map(targetUrl => ({ targetUrl }));
    }

    const subject: Record<string, unknown> = {
        ...(input.credentialSubject ?? {}),
    };

    if (Object.keys(achievement).length > 0) subject.achievement = achievement;
    if (input.tags && input.tags.length > 0) subject.tag = input.tags;

    const vc: Record<string, unknown> = {
        type: ['VerifiableCredential', input.type ?? 'VerifiableCredential'],
        issuer: input.issuer ?? 'did:example:demo-issuer',
        issuanceDate: new Date().toISOString(),
        ...(input.credentialId ? { id: input.credentialId } : {}),
        ...(Object.keys(subject).length > 0 ? { credentialSubject: subject } : {}),
    };

    try {
        publishWalletEvent({
            kind: 'credential-ingested',
            eventId,
            credentialUri,
            vc,
            ingestedAt: new Date().toISOString(),
            source: input.source ?? 'import',
            ...(input.boostUri ? { boostUri: input.boostUri } : {}),
        });
    } catch (err) {
        console.error('[pathwaysDev] simulateCredentialClaim rejected by bus:', err);

        return null;
    }

    const record = pathwayProgressReactor.lastDispatch();

    console.info(
        '[pathwaysDev] simulateCredentialClaim →',
        record
            ? {
                  nodeCompletions: record.nodeCompletions.length,
                  outcomeBindings: record.outcomeBindings?.length ?? 0,
                  credentialUri,
              }
            : '(no dispatch — reactor saw the event but matched nothing / no pathways)',
    );

    return record;
};

export interface SimulateSessionInput {
    /**
     * Topic boost URI the session ran against. Required — the
     * simulator refuses to publish without it because a topic-less
     * session cannot satisfy any `session-completed` termination.
     */
    topicUri: string;
    /** Optional AI Learning Pathway URI. */
    aiPathwayUri?: string;
    /** Session duration in seconds. Defaults to 300 (5 min). */
    durationSec?: number;
    /** Override for dedup testing. */
    eventId?: string;
    /** Override for dedup testing. Defaults to a synthetic thread id. */
    threadId?: string;
}

/**
 * Publish a synthetic `AiSessionCompleted` event. Mirrors what
 * `FinishSessionButton` emits in production. Useful for testing
 * `session-completed` terminations without having to actually
 * drive a tutor session through the websocket chat service.
 */
const simulateAiSessionFinish = (
    input: SimulateSessionInput,
): ProgressDispatchRecord | null => {
    if (!input.topicUri) {
        console.warn('[pathwaysDev] simulateAiSessionFinish requires a topicUri.');

        return null;
    }

    const eventId = input.eventId ?? uuid();
    const threadId = input.threadId ?? `sim-thread-${uuid()}`;
    const durationSec = input.durationSec ?? 300;

    try {
        publishWalletEvent({
            kind: 'ai-session-completed',
            eventId,
            threadId,
            topicUri: input.topicUri,
            ...(input.aiPathwayUri ? { aiPathwayUri: input.aiPathwayUri } : {}),
            endedAt: new Date().toISOString(),
            durationSec,
            source: 'user-finish',
        });
    } catch (err) {
        console.error('[pathwaysDev] simulateAiSessionFinish rejected by bus:', err);

        return null;
    }

    const record = pathwayProgressReactor.lastDispatch();

    console.info(
        '[pathwaysDev] simulateAiSessionFinish →',
        record
            ? {
                  nodeCompletions: record.nodeCompletions.length,
                  topicUri: input.topicUri,
                  threadId,
              }
            : '(no dispatch — reactor saw the event but matched nothing)',
    );

    return record;
};

/**
 * Print a summary of every termination on the active pathway with
 * its current progress status — makes it easy to verify that a
 * simulated event actually flipped the right node.
 */
const inspectActivePathway = (): void => {
    const activeId = pathwayStore.get.activePathwayId();

    if (!activeId) {
        console.warn('[pathwaysDev] No active pathway.');

        return;
    }

    const pathway = pathwayStore.get.pathways()[activeId];

    if (!pathway) return;

    console.info(`[pathwaysDev] Pathway: ${pathway.title} (${pathway.nodes.length} nodes)`);

    for (const node of pathway.nodes) {
        const termination: Termination = node.stage.termination;
        const status = node.progress.status;
        const marker = status === 'completed' ? '✓' : '·';

        console.info(
            `  ${marker} [${status.padEnd(11)}] ${node.title} — ${terminationLabel(termination)}`,
        );
    }

    console.info(
        `[pathwaysDev] Outcomes: ${pathway.outcomes?.length ?? 0} declared, ${
            pathway.outcomes?.filter(o => o.binding).length ?? 0
        } bound`,
    );
};

const terminationLabel = (termination: Termination): string => {
    switch (termination.kind) {
        case 'artifact-count':
            return `${termination.count} × ${termination.artifactType}`;
        case 'endorsement':
            return `${termination.minEndorsers} vouch(es)`;
        case 'self-attest':
            return 'self-attest';
        case 'assessment-score':
            return `score ≥ ${termination.min}`;
        case 'pathway-completed':
            return 'nested pathway complete';
        case 'composite':
            return `${termination.require} of ${termination.of.length}`;
        case 'requirement-satisfied':
            return `requirement (${termination.requirement.kind})`;
        case 'session-completed':
            return `session on ${termination.topicUri}`;
    }
};

/**
 * Nuclear reset — wipes every pathway, proposal, and reactor
 * dispatch-history entry. Useful when iterating on seed changes
 * (the store persists across hot-reloads, but a reset puts you
 * back at a known empty state).
 */
const resetPathwaysAndProposals = (): void => {
    pathwayStore.set.state(draft => {
        draft.pathways = {};
        draft.activePathwayId = null;
        draft.recentCompletion = null;
    });
    proposalStore.set.state(draft => {
        draft.proposals = {};
    });
    pathwayProgressReactor.resetDispatchHistory();

    console.info('[pathwaysDev] Wiped pathwayStore + proposalStore + reactor history.');
};

// ---------------------------------------------------------------------------
// Install
// ---------------------------------------------------------------------------

/**
 * Shape of `window.__pathwaysDev`. Exposed as an interface so
 * TypeScript consumers (e.g. ad-hoc scripts pasted into the console)
 * can type-check against it if they choose to.
 */
export interface PathwaysDevGlobals {
    /** Seed the AWS Cloud Practitioner demo pathway. Idempotent by title. */
    seedAws: (learnerDid: string) => string;
    /** Seed the pre-existing curated template + composite parent demo. */
    seedDemo: (learnerDid: string) => void;
    /**
     * Drop a synthesized matching VC against every outcome on the
     * active pathway → fire the pathway-level credential binder.
     * Pre-dates the post-v0.5 `requirement-satisfied` / node-level
     * binder path; use `simulateCredentialClaim` for node-level tests.
     */
    dropVc: (options?: DropVcOptions) => DropVcResult;
    /**
     * Publish a synthetic `CredentialIngested` event through the
     * walletEventBus. Exercises the full
     * `bus → reactor → nodeProgressBinder + credentialBinder →
     * proposal → auto-accept` pipeline, and populates provenance
     * hints on the identity extractor. Returns the reactor's
     * dispatch record (or null on a no-op).
     */
    simulateCredentialClaim: (input?: SimulateCredentialInput) => ProgressDispatchRecord | null;
    /** Publish a synthetic `AiSessionCompleted` event through the bus. */
    simulateAiSessionFinish: (input: SimulateSessionInput) => ProgressDispatchRecord | null;
    /**
     * Print a termination-by-termination snapshot of the active
     * pathway with progress status. Useful after a simulator call
     * to confirm the right node flipped.
     */
    inspectPathway: () => void;
    /** Snapshot of recent dispatch records. Oldest first. */
    listDispatches: () => readonly ProgressDispatchRecord[];
    /** Clear the reactor's dispatch history. */
    clearDispatches: () => void;
    /**
     * Nuclear reset — wipes every pathway, proposal, and reactor
     * dispatch-history entry so the next seed call starts clean.
     */
    resetAll: () => void;
}

declare global {
    interface Window {
        __pathwaysDev?: PathwaysDevGlobals;
    }
}

let installed = false;

export const installPathwaysDevGlobals = (): void => {
    if (installed) return;
    if (!import.meta.env.DEV) return;
    if (typeof window === 'undefined') return;

    installed = true;

    window.__pathwaysDev = {
        seedAws: (learnerDid: string) => seedAwsCloudPractitionerDemo(learnerDid).id,
        seedDemo: (learnerDid: string) => seedDemoPathwayIfEmpty(learnerDid),
        dropVc: (options?: DropVcOptions) => dropMatchingDemoVc(options),
        simulateCredentialClaim,
        simulateAiSessionFinish,
        inspectPathway: inspectActivePathway,
        listDispatches: () => pathwayProgressReactor.recentDispatches(),
        clearDispatches: () => pathwayProgressReactor.resetDispatchHistory(),
        resetAll: resetPathwaysAndProposals,
    };

    console.info(
        '[pathwaysDev] Installed. Available: seedAws(did) / seedDemo(did) / ' +
            'dropVc() / simulateCredentialClaim({...}) / simulateAiSessionFinish({topicUri}) / ' +
            'inspectPathway() / listDispatches() / clearDispatches() / resetAll().',
    );
};
