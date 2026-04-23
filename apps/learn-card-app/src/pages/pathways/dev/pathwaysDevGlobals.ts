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
import type { OutcomeSignal } from '../types';

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
    /** Drop a synthesized matching VC → fire the credential binder. */
    dropVc: (options?: DropVcOptions) => DropVcResult;
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
    };

    console.info(
        '[pathwaysDev] Installed. Available: __pathwaysDev.seedAws(did) / seedDemo(did) / dropVc().',
    );
};
