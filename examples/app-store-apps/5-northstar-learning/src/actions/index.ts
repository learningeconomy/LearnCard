/**
 * Northstar Learning — server actions for credential issuance.
 *
 * Three handlers, one per pathway stage, each shaped to satisfy a
 * *different* requirement kind on the LearnCard AWS Cloud Practitioner
 * demo pathway. The whole point of this app is to exercise the pathway
 * reactor's matcher registry end-to-end, so the VC shapes below match
 * the seed terminations in
 * `apps/learn-card-app/src/pages/pathways/dev/devSeed.ts`:
 *
 *   1. `issueCourseCompletion`   → `credential-type` matcher
 *      • VC `type` array contains `AWSCloudEssentialsCompletion`
 *      • Pathway node 1 completes.
 *   2. `issuePracticeScore`      → `score-threshold` matcher
 *      • VC `type` array contains `AWSPracticeExamScore`
 *      • `credentialSubject.practiceScore` carries a number; the
 *        pathway termination gates on `>= 80`.
 *      • Pathway node 2 completes only when the score clears the bar.
 *   3. `issueCoachingBadge`      → `ob-achievement` matcher
 *      • OBv3-shaped VC
 *      • `credentialSubject.achievement.id` is the stable URL
 *        `https://badges.northstar.learning/ach/aws-cloud-coach-drill`
 *        — matched exactly by the node termination.
 *      • Pathway node 3 completes.
 *
 * Each handler signs the VC locally with Northstar's issuer seed and
 * returns the signed credential. The frontend then calls
 * `learnCard.sendCredential(signed)` (Partner Connect SDK's raw-VC
 * path) to drop it into the learner's wallet, which publishes a
 * `CredentialIngested` event that the pathway reactor picks up.
 *
 * No network storage is touched here — this is pure local signing.
 * A future revision could add `network: true` to `initLearnCard` and
 * create boost templates (à la `3-mozilla-social-badges-app`), but
 * that's orthogonal to the pathway-matcher story we're telling.
 */

import { defineAction, ActionError } from 'astro:actions';
import { initLearnCard } from '@learncard/init';
import { z } from 'astro:schema';
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// Issuer bootstrap
// ---------------------------------------------------------------------------

const issuerSeed = import.meta.env.LEARNCARD_ISSUER_SEED;

if (!issuerSeed) {
    throw new Error(
        '[northstar] LEARNCARD_ISSUER_SEED environment variable is required. ' +
            'Copy .env.example to .env and set a hex-encoded seed. ' +
            'Generate one with: openssl rand -hex 32',
    );
}

// `initLearnCard` is idempotent for the same seed: it rebuilds an
// in-memory wallet each call but all derived keys / the DID are
// deterministic. We invoke it per-action so the handlers stay
// independent and free of module-scope state that could leak across
// requests. The overhead is a one-off key-derivation cost per call.
const getIssuer = async () => {
    return initLearnCard({ seed: issuerSeed as string });
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const nowIso = (): string => new Date().toISOString();

const urnId = (): string => `urn:uuid:${crypto.randomUUID()}`;

// Northstar vocabulary namespace. We don't ship a JSON-LD context
// document at this URL — we just use it as an IRI prefix on custom
// `@type` values (e.g. `https://ns.northstar.learning/v1#AWSPracticeExamScore`).
//
// That's a legitimate JSON-LD trick: absolute-IRI `@type` values are
// used as-is by the expansion pass — no term lookup, no context
// definition required. The LearnCard pathway's `typeMatches` helper
// then strips everything up to the last `:`/`/`/`#`, yielding the
// short form (`AWSPracticeExamScore`) that pathway authors actually
// write in `credential-type` / `score-threshold` requirements. Best
// of both worlds: the VC validates under strict JSON-LD and the
// pathway matcher keeps its ergonomic short-name API.
//
// Why not use an inline `{ '@vocab': ... }` context object? The
// LearnCard signer's `getContextURIs` walks `@context` arrays and
// passes every entry to `resolveDocument` as a *string URI*. Inline
// context objects crash it with "Key expansion failed". See
// `packages/plugins/didkit/src/helpers.ts:3-22` for the pipeline.
const NORTHSTAR_VOCAB_IRI = 'https://ns.northstar.learning/v1#';

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

/**
 * Build and sign a VC, wrapping any failure into an `ActionError` so
 * the frontend can render a friendly banner without crashing the page.
 * The `issuer` argument is passed in (rather than looked up inside) so
 * the caller can reuse a single issuer across several sign-and-send
 * cycles if it ever needs to.
 */
const signOrThrow = async (
    issuer: Awaited<ReturnType<typeof getIssuer>>,
    vc: Record<string, unknown>,
    contextLabel: string,
): Promise<{ credential: unknown }> => {
    try {
        const signed = await issuer.invoke.issueCredential(vc);

        return { credential: signed };
    } catch (err) {
        console.error(`[northstar] ${contextLabel} failed:`, err);

        throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message:
                err instanceof Error
                    ? err.message
                    : `Failed to issue credential (${contextLabel})`,
        });
    }
};

export const server = {
    /**
     * Issue a course-completion VC after the learner finishes the
     * Northstar Cloud Essentials course. Matched by pathway node 1's
     * `credential-type` termination.
     */
    issueCourseCompletion: defineAction({
        input: z.object({
            // Partner Connect SDK's `requestIdentity` always returns a
            // `did:` — validating the prefix catches obvious frontend
            // bugs (typos, stale fixtures) before we waste a sign.
            learnerDid: z.string().startsWith('did:'),
        }),
        handler: async ({ learnerDid }) => {
            const issuer = await getIssuer();
            const issuerDid = issuer.id.did();

            const vc = {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                ],
                id: urnId(),
                // Standard OBv3 shell (`VerifiableCredential`,
                // `OpenBadgeCredential`) plus an absolute-IRI custom
                // type. The pathway matcher's `typeMatches` strips
                // prefixes, so `credential-type: 'AWSCloudEssentialsCompletion'`
                // still resolves. The IRI form bypasses JSON-LD term
                // lookup (absolute IRIs don't need context entries),
                // so expansion succeeds without us publishing a
                // context document.
                type: [
                    'VerifiableCredential',
                    'OpenBadgeCredential',
                    `${NORTHSTAR_VOCAB_IRI}AWSCloudEssentialsCompletion`,
                ],
                issuer: issuerDid,
                validFrom: nowIso(),
                name: 'AWS Cloud Essentials — Course Completion',
                credentialSubject: {
                    id: learnerDid,
                    type: ['AchievementSubject'],
                    // `activityEndDate` is the OBv3-native property
                    // for when a learner finished the activity. We
                    // use it in place of a custom `completedAt` so
                    // strict JSON-LD expansion (which the signer
                    // runs) doesn't reject an undefined term.
                    activityEndDate: nowIso(),
                    achievement: {
                        id: 'https://badges.northstar.learning/ach/aws-cloud-essentials-course',
                        type: ['Achievement'],
                        name: 'AWS Cloud Essentials',
                        description:
                            'Completed Northstar’s AWS Cloud Essentials course covering EC2, S3, IAM, and VPC fundamentals.',
                        criteria: {
                            narrative:
                                'Finished every chapter of Northstar’s AWS Cloud Essentials course.',
                        },
                    },
                },
            };

            return signOrThrow(issuer, vc, 'issueCourseCompletion');
        },
    }),

    /**
     * Issue a practice-score VC. `practiceScore` is the learner's
     * running average across `examCount` timed exams. The pathway's
     * node-2 termination is a `score-threshold` matcher reading the
     * `practiceScore` field — anything `>= 80` completes the node.
     * We deliberately sign the VC even when the score is below the
     * threshold so the *matcher* decides whether the node completes,
     * not this handler. That keeps the app's role honest: "here's the
     * evidence, you decide" — same contract every real issuer has.
     */
    issuePracticeScore: defineAction({
        input: z.object({
            learnerDid: z.string().startsWith('did:'),
            practiceScore: z.number().min(0).max(100),
            examCount: z.number().int().min(1).default(5),
        }),
        handler: async ({ learnerDid, practiceScore, examCount }) => {
            const issuer = await getIssuer();
            const issuerDid = issuer.id.did();

            const vc = {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                ],
                id: urnId(),
                // OBv3 shell + absolute-IRI custom type. The pathway
                // `score-threshold` requirement on node 2 keys on
                // `AWSPracticeExamScore` (matched via prefix-strip)
                // AND a field path reading `result[0].value` — both
                // shapes below are chosen to make those two checks
                // pass under strict JSON-LD.
                type: [
                    'VerifiableCredential',
                    'OpenBadgeCredential',
                    `${NORTHSTAR_VOCAB_IRI}AWSPracticeExamScore`,
                ],
                issuer: issuerDid,
                validFrom: nowIso(),
                name: 'AWS Practice Exam — Score Report',
                credentialSubject: {
                    id: learnerDid,
                    type: ['AchievementSubject'],
                    activityEndDate: nowIso(),
                    achievement: {
                        id: 'https://badges.northstar.learning/ach/aws-practice-exam-score',
                        type: ['Achievement'],
                        name: 'AWS Cloud Practitioner — Practice Exam Score',
                        description: `Running average across ${examCount} Cloud Practitioner practice exams on Northstar Practice.`,
                        criteria: {
                            narrative:
                                'Completed a full set of five Cloud Practitioner practice exams; this credential reports the running-average score.',
                        },
                    },
                    // OBv3 `result[].value` is the canonical spot for
                    // a numeric score in an AchievementCredential.
                    // The pathway matcher reads `result.0.value`;
                    // `readPath` walks string-indexed array positions
                    // transparently, so no custom schema needed.
                    // `value` is typed as string in OBv3 — matcher
                    // coerces back to number via `Number(value)`.
                    result: [
                        {
                            type: ['Result'],
                            value: String(practiceScore),
                        },
                    ],
                },
            };

            return signOrThrow(issuer, vc, 'issuePracticeScore');
        },
    }),

    /**
     * Issue an OBv3-shaped coaching-drill badge. The pathway's node-3
     * termination is an `ob-achievement` matcher pointing at the URL
     * baked into `credentialSubject.achievement.id` below — keeping
     * both sides in sync is part of the demo's charm (it shows the
     * matcher reaching into the right nested field without any extra
     * provenance hints).
     */
    issueCoachingBadge: defineAction({
        input: z.object({
            learnerDid: z.string().startsWith('did:'),
        }),
        handler: async ({ learnerDid }) => {
            const issuer = await getIssuer();
            const issuerDid = issuer.id.did();

            const vc = {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                ],
                id: urnId(),
                // Pure OBv3 shape — no custom type needed because the
                // pathway `ob-achievement` matcher keys on
                // `credentialSubject.achievement.id` directly.
                type: ['VerifiableCredential', 'OpenBadgeCredential'],
                issuer: issuerDid,
                validFrom: nowIso(),
                name: 'AWS Cloud Coach — Gap-Close Drill',
                credentialSubject: {
                    id: learnerDid,
                    type: ['AchievementSubject'],
                    activityEndDate: nowIso(),
                    achievement: {
                        // This URL is the single source of truth. The
                        // matching pathway termination references it
                        // verbatim. DO NOT change one without changing
                        // the other — the whole demo hinges on this
                        // equality.
                        id: 'https://badges.northstar.learning/ach/aws-cloud-coach-drill',
                        type: ['Achievement'],
                        name: 'AWS Cloud Coach — Gap-Close Drill',
                        description:
                            'Completed a focused drill with Northstar AI Coach on the weakest AWS topics surfaced by practice exams.',
                        criteria: {
                            narrative:
                                'Finished an AI-coached drill covering IAM policies, VPC peering, and cost analyser topics.',
                        },
                    },
                },
            };

            return signOrThrow(issuer, vc, 'issueCoachingBadge');
        },
    }),
};
