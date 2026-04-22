/**
 * buildShowcase — the "everything we've built" demo bundle.
 *
 * ## Why this file exists
 *
 * The Map + Navigate + Build work has accumulated enough advanced
 * features (routes + ETA, collections, shared-prereq collapse,
 * composite/nested pathways, credential-engine provenance) that a
 * small clean pathway can't show them all at once. This module
 * hand-authors **four related pathways** — one parent plus three
 * supporting — that together exercise the interesting corners of the
 * system under a single coherent narrative: **a rising high-school
 * senior preparing to apply to a university AI / Finance program**.
 *
 * ## What it demonstrates
 *
 *   - **Top-level composition.** The primary pathway has two
 *     `composite` nodes, each pointing at a supporting pathway. One
 *     mirrors an NYC DOE *Future Ready* track, the other an IMA
 *     *AI in Finance* micro-credential — both real CTDL references
 *     we've shipped catalog entries for. The refs are local
 *     (hand-authored here) so the demo works offline and stays
 *     deterministic across imports.
 *   - **Nested sub-pathways.** Inside the Software Development
 *     sub-pathway, the capstone step is *itself* a composite ref to
 *     a fourth pathway. That gives reviewers a two-level nest to
 *     demonstrate drill-in / breadcrumb behavior.
 *   - **Collection + shared-prereq collapse (Option 2).** Both the
 *     Software Development track and the AI-in-Finance track use the
 *     new rule #3: a single upstream node gates N siblings that
 *     fan-in to a target. `detectCollections` folds them into a
 *     single "Earn N badges" card on the Map, and the synthetic
 *     prereq→collection funnel keeps the incoming edge visible.
 *   - **Route + ETA.** Every supporting pathway sets a destination,
 *     and the primary pathway's destination is several hops away
 *     through composite chains — exactly the shape that exercises
 *     `computeSuggestedRoute`'s AND-prereq semantics.
 *   - **Realistic policy mix.** `artifact`, `practice`, and
 *     `composite` policies appear across the bundle; terminations
 *     span `artifact-count`, `self-attest`, `endorsement`, and
 *     `pathway-completed`.
 *
 * ## Contract
 *
 * Pure function. Takes an `ownerDid`, `now`, and an `id` factory
 * (default: `crypto.randomUUID`). Returns the primary pathway plus
 * the three supporting pathways that the importer should upsert
 * alongside it — the caller persists the supporting trio before
 * committing the primary so the composite refs resolve on first
 * render.
 *
 * The bundle does *not* touch the store. `ImportCtdlModal` commits
 * the supporting pathways via `onImport`'s extended `supporting`
 * channel; `BuildMode.handleImported` walks the array and upserts
 * each one before pinning the primary as active.
 */

import type {
    AchievementProjection,
    Edge,
    Pathway,
    PathwayNode,
    Policy,
    Termination,
} from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface IdFactory {
    (): string;
}

const defaultGenerateId: IdFactory = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    // Node-less fallback — in practice we always have crypto.randomUUID
    // in the browser and jsdom/vitest test environment.
    // eslint-disable-next-line no-console
    console.warn('[showcase] crypto.randomUUID unavailable; falling back to Math.random id');
    const part = () => Math.random().toString(16).slice(2, 10);
    return `${part()}-${part().slice(0, 4)}-${part().slice(0, 4)}-${part().slice(0, 4)}-${part()}${part().slice(0, 4)}`;
};

/**
 * Describe a node in slug-keyed form so we can wire edges by human
 * name, then resolve slugs → UUIDs in one pass. Mirrors the shape
 * `onboard/templates.ts` uses for simple templates, extended with
 * optional provenance (to mark a supporting pathway as CE-sourced).
 */
interface NodeSpec {
    slug: string;
    title: string;
    description?: string;
    policy: Policy | PolicyBuilder;
    termination: Termination | TerminationBuilder;
    credentialProjection?: AchievementProjection;
    sourceUri?: string;
    sourceCtid?: string;
}

interface EdgeSpec {
    from: string;
    to: string;
}

/**
 * Allow the composite policy + termination to reference another
 * pathway by its local slug rather than UUID. The assembler resolves
 * slugs to the concrete ids at the end.
 */
type PolicyBuilder = { __kind: 'composite-ref'; pathwaySlug: string; renderStyle?: 'inline-expandable' | 'link-out' };
type TerminationBuilder = { __kind: 'pathway-completed-ref'; pathwaySlug: string };

const compositeRef = (pathwaySlug: string, renderStyle: 'inline-expandable' | 'link-out' = 'inline-expandable'): PolicyBuilder => ({
    __kind: 'composite-ref',
    pathwaySlug,
    renderStyle,
});

const pathwayCompletedRef = (pathwaySlug: string): TerminationBuilder => ({
    __kind: 'pathway-completed-ref',
    pathwaySlug,
});

// ---------------------------------------------------------------------------
// Policy / termination shorthands
// ---------------------------------------------------------------------------

const artifactPolicy = (
    prompt: string,
    expectedArtifact: 'text' | 'link' | 'pdf' = 'text',
): Policy => ({
    kind: 'artifact',
    prompt,
    expectedArtifact,
});

const practicePolicy = (
    frequency: 'daily' | 'weekly' | 'monthly' | 'ad-hoc',
    perPeriod: number = 1,
): Policy => ({
    kind: 'practice',
    cadence: { frequency, perPeriod },
    artifactTypes: ['text'],
});

const selfAttest = (prompt: string): Termination => ({ kind: 'self-attest', prompt });

const artifactCount = (count: number, artifactType: 'text' | 'link' | 'pdf' = 'text'): Termination => ({
    kind: 'artifact-count',
    count,
    artifactType,
});

const endorsement = (minEndorsers: number): Termination => ({
    kind: 'endorsement',
    minEndorsers,
});

// ---------------------------------------------------------------------------
// Pathway specs (slug-keyed, resolved by assemble())
// ---------------------------------------------------------------------------

interface PathwaySpec {
    slug: string;
    title: string;
    goal: string;
    nodes: NodeSpec[];
    edges: EdgeSpec[];
    destinationSlug?: string;
    /** CE provenance — set when a pathway mirrors a real CTDL resource. */
    sourceUri?: string;
    sourceCtid?: string;
}

// -----------------------------------------------------------------
// Pathway D — "Capstone Software Project" (deepest nest, 4 steps)
// Simple linear chain so the nest reads clean.
// -----------------------------------------------------------------
const CAPSTONE_SPEC: PathwaySpec = {
    slug: 'capstone',
    title: 'Capstone Software Project',
    goal: 'Ship a capstone software project end-to-end',
    nodes: [
        {
            slug: 'pitch',
            title: 'Pitch the project idea',
            description: 'One-page pitch: problem, users, success criteria.',
            policy: artifactPolicy('Attach your one-page pitch deck or write-up.'),
            termination: selfAttest('Pitch submitted.'),
        },
        {
            slug: 'prototype',
            title: 'Build a working prototype',
            description: 'A clickable prototype that demonstrates the core flow.',
            policy: artifactPolicy('Attach a link to the prototype (Figma, CodeSandbox, GitHub, etc).', 'link'),
            termination: artifactCount(1, 'link'),
        },
        {
            slug: 'user-testing',
            title: 'Run weekly user tests',
            description: 'Three weeks of feedback cycles with real users.',
            policy: practicePolicy('weekly', 1),
            termination: selfAttest('Three weeks of testing complete.'),
        },
        {
            slug: 'presentation',
            title: 'Final presentation',
            description: 'Present to a mentor and capture their endorsement.',
            policy: artifactPolicy('Attach slides or a recording link.', 'link'),
            termination: endorsement(1),
            credentialProjection: {
                achievementType: 'capstone-project',
                criteria:
                    'Pitched, prototyped, tested, and presented a complete software capstone.',
            },
        },
    ],
    edges: [
        { from: 'pitch', to: 'prototype' },
        { from: 'prototype', to: 'user-testing' },
        { from: 'user-testing', to: 'presentation' },
    ],
    destinationSlug: 'presentation',
};

// -----------------------------------------------------------------
// Pathway B — "Future Ready NYC — Software Development"
// Exercises: shared-prereq collection (portfolio gates 4 algo
// practices), nested sub-pathway (capstone → Pathway D).
// Marked with CE provenance from the catalog entry.
// -----------------------------------------------------------------
const FUTURE_READY_SPEC: PathwaySpec = {
    slug: 'future-ready-sd',
    title: 'Future Ready NYC — Software Development',
    goal: 'Earn an industry-recognized software development credential',
    sourceCtid: 'ce-0f0af1dd-35c7-43e2-9363-6bc079508747',
    sourceUri:
        'https://credentialengineregistry.org/resources/ce-0f0af1dd-35c7-43e2-9363-6bc079508747',
    nodes: [
        {
            slug: 'intro-cs',
            title: 'Intro to Computer Science',
            description: 'A semester-long intro course covering fundamentals.',
            policy: artifactPolicy('Attach your course completion certificate or transcript.', 'link'),
            termination: selfAttest('I completed Intro to CS.'),
        },
        {
            slug: 'portfolio',
            title: 'Build a personal portfolio site',
            description:
                'A live, deployed site showcasing your projects. This unlocks the four algorithm practices and the capstone.',
            policy: artifactPolicy('Attach the live URL of your portfolio.', 'link'),
            termination: artifactCount(1, 'link'),
        },
        // The 4 algorithm practices form a *collection* — same policy
        // kind, same fan-in target, same shared prereq (portfolio).
        {
            slug: 'algo-arrays',
            title: 'Array & List Algorithms',
            description: 'Weekly practice sets on two-pointer, sliding window, and prefix sums.',
            policy: practicePolicy('weekly', 2),
            termination: artifactCount(4),
            credentialProjection: {
                achievementType: 'algorithm-badge',
                criteria: 'Completed 4 weeks of array/list algorithm practice.',
            },
        },
        {
            slug: 'algo-strings',
            title: 'String Algorithms',
            description: 'Pattern matching, tries, and rolling-hash problems.',
            policy: practicePolicy('weekly', 2),
            termination: artifactCount(4),
            credentialProjection: {
                achievementType: 'algorithm-badge',
                criteria: 'Completed 4 weeks of string algorithm practice.',
            },
        },
        {
            slug: 'algo-graphs',
            title: 'Graph Algorithms',
            description: 'BFS, DFS, shortest paths, and union-find.',
            policy: practicePolicy('weekly', 2),
            termination: artifactCount(4),
            credentialProjection: {
                achievementType: 'algorithm-badge',
                criteria: 'Completed 4 weeks of graph algorithm practice.',
            },
        },
        {
            slug: 'algo-dp',
            title: 'Dynamic Programming',
            description: 'Memoization, tabulation, and classic DP patterns.',
            policy: practicePolicy('weekly', 2),
            termination: artifactCount(4),
            credentialProjection: {
                achievementType: 'algorithm-badge',
                criteria: 'Completed 4 weeks of dynamic programming practice.',
            },
        },
        // Capstone — a composite ref to Pathway D. This is the nested
        // sub-pathway demonstration: the author can drill into this
        // node to edit the capstone pathway on its own.
        {
            slug: 'capstone-ref',
            title: 'Complete your capstone project',
            description: 'A multi-week capstone: pitch, prototype, test, present.',
            policy: compositeRef('capstone', 'inline-expandable'),
            termination: pathwayCompletedRef('capstone'),
        },
        {
            slug: 'sd-cert',
            title: 'Software Development Certificate',
            description: 'Awarded on completion of all four algorithm tracks and the capstone.',
            policy: artifactPolicy('Attach your final certificate document.', 'pdf'),
            termination: endorsement(1),
            credentialProjection: {
                achievementType: 'software-development-certificate',
                criteria:
                    'Earned all four algorithm badges and completed the capstone project.',
            },
        },
    ],
    edges: [
        // intro-cs kicks off two parallel tracks.
        //
        // Keeping capstone on a *different* incoming path from the
        // algo practices matters for collection detection: a
        // collection requires every member to share not only the
        // target but *also* the exact incoming-prereq set. If
        // capstone were gated by portfolio (same as the algos) it
        // would land in the same fan-in sub-bucket and — because
        // its policy kind is `composite` rather than `practice` —
        // the kind-parity guard would reject the whole group. So
        // capstone branches off intro-cs and stays in its own lane.
        { from: 'intro-cs', to: 'portfolio' },
        { from: 'intro-cs', to: 'capstone-ref' },
        // Shared prereq → collection: portfolio gates all 4 algo
        // practices. This is the Option-2 shape Map collapses into a
        // single `portfolio → Earn 4 badges` synthetic edge.
        { from: 'portfolio', to: 'algo-arrays' },
        { from: 'portfolio', to: 'algo-strings' },
        { from: 'portfolio', to: 'algo-graphs' },
        { from: 'portfolio', to: 'algo-dp' },
        // All 4 algos feed the certificate (fan-in, AND-gate).
        { from: 'algo-arrays', to: 'sd-cert' },
        { from: 'algo-strings', to: 'sd-cert' },
        { from: 'algo-graphs', to: 'sd-cert' },
        { from: 'algo-dp', to: 'sd-cert' },
        // Capstone also feeds the certificate.
        { from: 'capstone-ref', to: 'sd-cert' },
    ],
    destinationSlug: 'sd-cert',
};

// -----------------------------------------------------------------
// Pathway C — "AI in Finance Micro-credential"
// Exercises: shared-prereq collection with 5 badges. Mirrors the
// real IMA pathway shape from the screenshots — but with an explicit
// math-refresher prereq so the Option-2 fan-in is front-and-center.
// -----------------------------------------------------------------
const AI_FINANCE_SPEC: PathwaySpec = {
    slug: 'ai-finance',
    title: 'AI in Finance Micro-credential',
    goal: 'Earn the IMA AI-in-Finance micro-credential',
    sourceCtid: 'ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf',
    sourceUri:
        'https://credentialengineregistry.org/resources/ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf',
    nodes: [
        {
            slug: 'math-refresher',
            title: 'Pre-work: Statistics refresher',
            description:
                'A short review of probability, descriptive stats, and regression fundamentals. Gates all five badges.',
            policy: artifactPolicy(
                'Attach your completion certificate or notes from the refresher.',
            ),
            termination: selfAttest('Refresher complete.'),
        },
        {
            slug: 'badge-fundamentals',
            title: 'Fundamentals of AI',
            description:
                'Core AI concepts: models, training, and the vocabulary a finance professional needs.',
            policy: artifactPolicy('Submit a link to your earned badge.', 'link'),
            termination: endorsement(1),
            credentialProjection: {
                achievementType: 'digital-badge',
                criteria: 'Earned the IMA Fundamentals of AI badge.',
            },
        },
        {
            slug: 'badge-data-literacy',
            title: 'Data Literacy for Finance Professionals',
            description: 'Reading, cleaning, and reasoning about financial data.',
            policy: artifactPolicy('Submit a link to your earned badge.', 'link'),
            termination: endorsement(1),
            credentialProjection: {
                achievementType: 'digital-badge',
                criteria: 'Earned the Data Literacy for Finance Pros badge.',
            },
        },
        {
            slug: 'badge-ethics',
            title: 'Ethics, Governance, and Regulatory Considerations',
            description: 'Frameworks for responsible AI use in regulated industries.',
            policy: artifactPolicy('Submit a link to your earned badge.', 'link'),
            termination: endorsement(1),
            credentialProjection: {
                achievementType: 'digital-badge',
                criteria: 'Earned the Ethics, Governance, and Regulatory badge.',
            },
        },
        {
            slug: 'badge-strategic',
            title: 'Strategic Implementation & Business Value of AI',
            description: 'Taking AI from pilot to production in finance teams.',
            policy: artifactPolicy('Submit a link to your earned badge.', 'link'),
            termination: endorsement(1),
            credentialProjection: {
                achievementType: 'digital-badge',
                criteria: 'Earned the Strategic Implementation badge.',
            },
        },
        {
            slug: 'badge-generative',
            title: 'Generative AI in Accounting & Finance',
            description: 'Practical generative-AI applications for accounting workflows.',
            policy: artifactPolicy('Submit a link to your earned badge.', 'link'),
            termination: endorsement(1),
            credentialProjection: {
                achievementType: 'digital-badge',
                criteria: 'Earned the Generative AI in Accounting & Finance badge.',
            },
        },
        {
            slug: 'ai-finance-cert',
            title: 'AI in Finance Micro-credential Certificate',
            description: 'Awarded on completion of all five underlying badges.',
            policy: artifactPolicy(
                'Attach the certificate issued by IMA (PDF or credential URL).',
                'pdf',
            ),
            termination: selfAttest('Certificate issued.'),
            credentialProjection: {
                achievementType: 'micro-credential',
                criteria: 'Earned all five component badges.',
            },
        },
    ],
    edges: [
        // Shared prereq → 5 badges. All five are the same policy-kind
        // artifact → detection groups them; all five share the exact
        // same incoming {math-refresher} → Option-2 keeps the group.
        { from: 'math-refresher', to: 'badge-fundamentals' },
        { from: 'math-refresher', to: 'badge-data-literacy' },
        { from: 'math-refresher', to: 'badge-ethics' },
        { from: 'math-refresher', to: 'badge-strategic' },
        { from: 'math-refresher', to: 'badge-generative' },
        // Fan-in to certificate.
        { from: 'badge-fundamentals', to: 'ai-finance-cert' },
        { from: 'badge-data-literacy', to: 'ai-finance-cert' },
        { from: 'badge-ethics', to: 'ai-finance-cert' },
        { from: 'badge-strategic', to: 'ai-finance-cert' },
        { from: 'badge-generative', to: 'ai-finance-cert' },
    ],
    destinationSlug: 'ai-finance-cert',
};

// -----------------------------------------------------------------
// Pathway A — primary / top-level
// -----------------------------------------------------------------
const PRIMARY_SPEC: PathwaySpec = {
    slug: 'senior-year',
    title: 'Senior Year: AI / Finance College Track',
    goal: 'Earn a seat in a top university AI or Finance program',
    nodes: [
        {
            slug: 'research',
            title: 'Research target programs',
            description:
                'Pick three universities and note what each looks for in an AI / Finance applicant.',
            policy: artifactPolicy(
                'Write a short comparison of three programs — strengths, prereqs, deadlines.',
            ),
            termination: selfAttest('I picked my three target programs.'),
        },
        {
            slug: 'sat',
            title: 'Take the SAT',
            description: 'A strong score is still table stakes for the programs you are targeting.',
            policy: artifactPolicy('Attach your SAT score report.', 'pdf'),
            termination: selfAttest('Score submitted.'),
        },
        {
            slug: 'future-ready',
            title: 'Future Ready NYC — Software Development',
            description:
                'A multi-track career pathway covering computer science, algorithms, and a capstone project.',
            policy: compositeRef('future-ready-sd', 'inline-expandable'),
            termination: pathwayCompletedRef('future-ready-sd'),
            sourceCtid: 'ce-0f0af1dd-35c7-43e2-9363-6bc079508747',
            sourceUri:
                'https://credentialengineregistry.org/resources/ce-0f0af1dd-35c7-43e2-9363-6bc079508747',
        },
        {
            slug: 'ai-finance-ref',
            title: 'AI in Finance Micro-credential',
            description:
                'Five IMA badges build into a full micro-credential that signals AI + finance fluency.',
            policy: compositeRef('ai-finance', 'inline-expandable'),
            termination: pathwayCompletedRef('ai-finance'),
            sourceCtid: 'ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf',
            sourceUri:
                'https://credentialengineregistry.org/resources/ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf',
        },
        {
            slug: 'personal-statement',
            title: 'Draft your personal statement',
            description:
                'Thread your academic work, technical credentials, and AI-finance curiosity into one essay.',
            policy: artifactPolicy(
                'Attach a 500–650 word draft of your personal statement.',
            ),
            termination: artifactCount(1),
        },
        {
            slug: 'teacher-rec',
            title: 'Secure a teacher recommendation',
            description: 'Ask a teacher who has seen your best work to endorse the application.',
            policy: artifactPolicy(
                'Capture the recommender (and the course / project they know you from).',
            ),
            termination: endorsement(1),
        },
        {
            slug: 'submit-apps',
            title: 'Submit your applications',
            description:
                'Final check: transcript, test scores, statement, recommendations, credentials. Hit submit.',
            policy: artifactPolicy(
                'Attach confirmation emails or screenshots of each submitted application.',
            ),
            termination: selfAttest('Applications are in.'),
            credentialProjection: {
                achievementType: 'milestone',
                criteria:
                    'Submitted completed applications to three target AI/Finance programs.',
            },
        },
    ],
    edges: [
        // Research unlocks both credential tracks in parallel.
        { from: 'research', to: 'future-ready' },
        { from: 'research', to: 'ai-finance-ref' },
        // SAT score + both tracks feed the personal statement (it's
        // the moment where every prior thread becomes one narrative).
        { from: 'sat', to: 'personal-statement' },
        { from: 'future-ready', to: 'personal-statement' },
        { from: 'ai-finance-ref', to: 'personal-statement' },
        // Statement → teacher rec → submit (linear final stretch).
        { from: 'personal-statement', to: 'teacher-rec' },
        { from: 'teacher-rec', to: 'submit-apps' },
    ],
    destinationSlug: 'submit-apps',
};

// ---------------------------------------------------------------------------
// Assembler
// ---------------------------------------------------------------------------

/** Identifier of this showcase bundle, used by `templateRef`. */
export const SHOWCASE_TEMPLATE_REF = 'showcase-senior-year-ai-finance';

export interface BuildShowcaseOptions {
    ownerDid: string;
    /** ISO timestamp — stamped onto `createdAt` / `updatedAt`. */
    now?: string;
    /** UUID factory; defaults to `crypto.randomUUID`. Pass in tests. */
    generateId?: IdFactory;
}

export interface ShowcaseBundle {
    /** The pathway the learner lands on after import. */
    primary: Pathway;
    /** Sub-pathways referenced (composite / nested). Upsert before primary. */
    supporting: Pathway[];
}

/**
 * Build the four-pathway demo. Pure function — safe to call many
 * times, always emits fresh UUIDs so two imports don't clash.
 */
export const buildShowcase = (opts: BuildShowcaseOptions): ShowcaseBundle => {
    const {
        ownerDid,
        now = new Date().toISOString(),
        generateId = defaultGenerateId,
    } = opts;

    // Two-phase resolution:
    //   1. Allocate a pathway id per spec (slug → id).
    //   2. Allocate a node id per (pathway, slug) (namespaced key → id).
    // Then realize specs → concrete Pathway objects, rewriting any
    // composite / pathway-completed refs from slug to uuid.
    const specs: PathwaySpec[] = [
        PRIMARY_SPEC,
        FUTURE_READY_SPEC,
        AI_FINANCE_SPEC,
        CAPSTONE_SPEC,
    ];

    const pathwayIdBySlug: Record<string, string> = {};
    for (const s of specs) pathwayIdBySlug[s.slug] = generateId();

    const nodeIdKey = (pathwaySlug: string, nodeSlug: string) => `${pathwaySlug}::${nodeSlug}`;
    const nodeIdByKey: Record<string, string> = {};
    for (const s of specs) {
        for (const n of s.nodes) nodeIdByKey[nodeIdKey(s.slug, n.slug)] = generateId();
    }

    const resolvePolicy = (builderOrPolicy: Policy | PolicyBuilder): Policy => {
        if ('__kind' in builderOrPolicy && builderOrPolicy.__kind === 'composite-ref') {
            const refPathwayId = pathwayIdBySlug[builderOrPolicy.pathwaySlug];
            if (!refPathwayId) {
                throw new Error(
                    `[showcase] composite ref to unknown pathway slug: ${builderOrPolicy.pathwaySlug}`,
                );
            }

            return {
                kind: 'composite',
                pathwayRef: refPathwayId,
                renderStyle: builderOrPolicy.renderStyle ?? 'inline-expandable',
            };
        }
        return builderOrPolicy as Policy;
    };

    const resolveTermination = (
        builderOrTermination: Termination | TerminationBuilder,
    ): Termination => {
        if (
            '__kind' in builderOrTermination
            && builderOrTermination.__kind === 'pathway-completed-ref'
        ) {
            const refPathwayId = pathwayIdBySlug[builderOrTermination.pathwaySlug];
            if (!refPathwayId) {
                throw new Error(
                    `[showcase] pathway-completed ref to unknown pathway slug: ${builderOrTermination.pathwaySlug}`,
                );
            }

            return { kind: 'pathway-completed', pathwayRef: refPathwayId };
        }
        return builderOrTermination as Termination;
    };

    const realize = (spec: PathwaySpec): Pathway => {
        const pathwayId = pathwayIdBySlug[spec.slug]!;

        const nodes: PathwayNode[] = spec.nodes.map(n => ({
            id: nodeIdByKey[nodeIdKey(spec.slug, n.slug)]!,
            pathwayId,
            title: n.title,
            description: n.description,
            stage: {
                initiation: [],
                policy: resolvePolicy(n.policy),
                termination: resolveTermination(n.termination),
            },
            credentialProjection: n.credentialProjection,
            endorsements: [],
            progress: {
                status: 'not-started',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
            },
            createdBy: 'template',
            createdAt: now,
            updatedAt: now,
            sourceUri: n.sourceUri,
            sourceCtid: n.sourceCtid,
        }));

        const edges: Edge[] = spec.edges.map(e => {
            const fromId = nodeIdByKey[nodeIdKey(spec.slug, e.from)];
            const toId = nodeIdByKey[nodeIdKey(spec.slug, e.to)];

            if (!fromId || !toId) {
                throw new Error(
                    `[showcase] edge references unknown slug in pathway "${spec.slug}": ${e.from} → ${e.to}`,
                );
            }

            return {
                id: generateId(),
                from: fromId,
                to: toId,
                type: 'prerequisite',
            };
        });

        const destinationNodeId = spec.destinationSlug
            ? nodeIdByKey[nodeIdKey(spec.slug, spec.destinationSlug)]
            : undefined;

        return {
            id: pathwayId,
            ownerDid,
            title: spec.title,
            goal: spec.goal,
            nodes,
            edges,
            status: 'active',
            visibility: {
                self: true,
                mentors: false,
                guardians: false,
                publicProfile: false,
            },
            source: spec.sourceCtid ? 'ctdl-imported' : 'template',
            templateRef: SHOWCASE_TEMPLATE_REF,
            destinationNodeId,
            sourceUri: spec.sourceUri,
            sourceCtid: spec.sourceCtid,
            createdAt: now,
            updatedAt: now,
        };
    };

    const primary = realize(PRIMARY_SPEC);
    const supporting: Pathway[] = [
        realize(FUTURE_READY_SPEC),
        realize(AI_FINANCE_SPEC),
        realize(CAPSTONE_SPEC),
    ];

    return { primary, supporting };
};

/**
 * Lightweight metadata used by the import modal to render the
 * showcase card without instantiating the bundle. Kept in-sync
 * manually — there are only a few fields and the tradeoff of "one
 * source of truth" against "have to call build() just to show a
 * description on the card" isn't worth it.
 */
export const SHOWCASE_PREVIEW = {
    title: 'Senior Year: AI / Finance College Track',
    description:
        'A realistic senior-year student journey that combines two Credential Engine sub-pathways, a nested capstone, and shared-prereq badge collections — end-to-end.',
    subPathwayCount: 3,
    totalStepCount:
        PRIMARY_SPEC.nodes.length
        + FUTURE_READY_SPEC.nodes.length
        + AI_FINANCE_SPEC.nodes.length
        + CAPSTONE_SPEC.nodes.length,
    featureTags: [
        'Composite pathways',
        'Nested sub-pathway',
        'Shared-prereq collection',
        'Credential Engine refs',
    ] as const,
} as const;
