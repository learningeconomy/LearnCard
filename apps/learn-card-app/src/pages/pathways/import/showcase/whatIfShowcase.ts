/**
 * whatIfShowcase — the bundle that lights up the What-If surface.
 *
 * ## Why this showcase exists
 *
 * What-If's five scenario generators each need a *reason* to fire
 * against a pathway. A showcase bundle that triggers all of them
 * simultaneously is the fastest way for reviewers to see the
 * surface's full behavior (fast-track, deep-practice, external-light,
 * composite-bypass, destination-only) in one screen.
 *
 * Rather than squeeze a contrived shape onto an existing showcase,
 * we hand-author a coherent narrative — **a data-analyst portfolio
 * sprint** — whose pedagogy naturally contains every policy kind:
 *
 *   - daily SQL / Python **practice** → deep-practice scenario fires.
 *   - spaced-repetition **reviews** of SQL + stats → fast-track fires.
 *   - one **external** Coursera module → external-light fires.
 *   - one **composite** link to a small Statistics Foundations
 *     sub-pathway → composite-bypass fires.
 *   - fan-in of 5+ ancestors into the **assessment** destination →
 *     destination-only fires.
 *
 * The narrative is deliberately domain-adjacent (data analysis
 * rather than some generic "learner") so each node title reads like
 * something a real learner would plausibly sit down and do. That
 * matters because What-If's scenarios reference the pathway's own
 * language in their subtitles ("Skip 2 review steps…"); abstract
 * node titles would produce abstract scenario cards.
 *
 * ## Structure
 *
 * ```
 *                                 ┌─► review-sql ──┐
 *                   sql-practice ─┤                │
 *                                 └─► review-stats ┤
 *                                                  │
 *                python-practice ─► write-notebook ┤
 *                                                  ├─► mentor-accept
 *                         coursera-module ─────────┤     (destination)
 *                                                  │
 *                   stats-foundations (composite) ─┤
 *                                                  │
 *                   draft-write-up ────────────────┘
 * ```
 *
 *   - `mentor-accept` is the destination.
 *   - Six ancestors feed in, of which three (coursera-module,
 *     stats-foundations, draft-write-up) sit directly on the
 *     shortest path when the learner picks them first. Everything
 *     else is sibling-evidence the destination-only scenario can
 *     prune.
 *
 * The Statistics Foundations sub-pathway is a tight 3-node chain
 * terminating in a small quiz — just enough to be a real nested
 * pathway without pulling focus from the primary.
 */

import {
    artifactCount,
    artifactPolicy,
    assembleBundle,
    assessmentPolicy,
    compositeRef,
    endorsement,
    externalPolicy,
    pathwayCompletedRef,
    practicePolicy,
    reviewPolicy,
    selfAttest,
    type PathwaySpec,
} from './buildBundle';
import type {
    BuildShowcaseOptions,
    ShowcaseBundle,
    ShowcaseDefinition,
    ShowcasePreview,
} from './types';

// -----------------------------------------------------------------
// Sub-pathway — Statistics Foundations (composite target)
// -----------------------------------------------------------------

const STATS_SPEC: PathwaySpec = {
    slug: 'stats-foundations',
    title: 'Statistics Foundations',
    goal: 'Build working intuition for descriptive + inferential stats',
    nodes: [
        {
            slug: 'descriptive-stats',
            title: 'Practice descriptive statistics',
            description:
                'Work through a short set of mean / median / variance exercises each day for a week.',
            policy: practicePolicy('daily', 1),
            termination: selfAttest('A week of descriptive-stats reps done.'),
        },
        {
            slug: 'inferential-writeup',
            title: 'Write up an inferential example',
            description:
                'Pick a real dataset; explain a hypothesis test end-to-end in plain language.',
            policy: artifactPolicy(
                'Attach a write-up (link or doc) that walks through a hypothesis test.',
                'text',
            ),
            termination: artifactCount(1, 'text'),
        },
        {
            slug: 'foundations-check',
            title: 'Foundations quiz',
            description: 'Short rubric-based check-in with your mentor on core concepts.',
            policy: assessmentPolicy([
                {
                    id: 'descriptive-fluency',
                    description: 'Correctly applies descriptive stats to a new dataset.',
                },
                {
                    id: 'inferential-reasoning',
                    description: 'Explains confidence intervals and p-values in plain language.',
                },
            ]),
            termination: selfAttest('Foundations quiz complete.'),
            credentialProjection: {
                achievementType: 'stats-foundations',
                criteria:
                    'Practiced descriptive stats, wrote up a hypothesis test, and passed the foundations quiz.',
            },
        },
    ],
    edges: [
        { from: 'descriptive-stats', to: 'inferential-writeup' },
        { from: 'inferential-writeup', to: 'foundations-check' },
    ],
    destinationSlug: 'foundations-check',
};

// -----------------------------------------------------------------
// Primary pathway — Portfolio Sprint
// -----------------------------------------------------------------

const PRIMARY_SPEC: PathwaySpec = {
    slug: 'portfolio-sprint',
    title: 'Portfolio sprint: land your first data role',
    goal: 'Ship a portfolio piece a mentor endorses by end of sprint',
    nodes: [
        {
            slug: 'sql-practice',
            title: 'Daily SQL practice',
            description: 'Short SQL exercises each day — window functions, joins, gotchas.',
            policy: practicePolicy('daily', 1),
            termination: selfAttest('At least a week of SQL reps logged.'),
        },
        {
            slug: 'python-practice',
            title: 'Daily Python notebooks',
            description: 'One focused notebook per weekday — pandas, numpy, a small chart.',
            policy: practicePolicy('daily', 1),
            termination: selfAttest('Five notebooks this week.'),
        },
        {
            slug: 'review-sql',
            title: 'Spaced review: SQL concepts',
            description:
                'Lightweight review cards on SQL concepts the scheduler surfaces.',
            policy: reviewPolicy(),
            termination: selfAttest('Today\u2019s SQL reviews cleared.'),
        },
        {
            slug: 'review-stats',
            title: 'Spaced review: stats vocabulary',
            description:
                'Lightweight review cards on stats vocab the scheduler surfaces.',
            policy: reviewPolicy(),
            termination: selfAttest('Today\u2019s stats reviews cleared.'),
        },
        {
            slug: 'coursera-module',
            title: 'Coursera: Exploratory Data Analysis',
            description:
                'Finish the EDA module on Coursera — launched via your MCP tool.',
            policy: externalPolicy('coursera', 'launch-module'),
            termination: selfAttest('Module completion reported.'),
        },
        {
            slug: 'stats-foundations',
            title: 'Statistics Foundations',
            description:
                'A nested sub-pathway that builds descriptive + inferential fluency.',
            policy: compositeRef('stats-foundations', 'inline-expandable'),
            termination: pathwayCompletedRef('stats-foundations'),
        },
        {
            slug: 'draft-writeup',
            title: 'Draft the portfolio write-up',
            description:
                'Write the narrative: question, dataset, findings, caveats, next steps.',
            policy: artifactPolicy(
                'Attach your draft (link or doc).',
                'link',
            ),
            termination: artifactCount(1, 'link'),
        },
        {
            slug: 'mentor-accept',
            title: 'Mentor review + endorsement',
            description:
                'Share the portfolio piece with your mentor; iterate until they endorse it.',
            policy: assessmentPolicy([
                {
                    id: 'clarity',
                    description: 'Narrative is clear to a non-expert reader.',
                },
                {
                    id: 'rigor',
                    description: 'Methodology is sound and honestly caveated.',
                },
                {
                    id: 'polish',
                    description: 'Visualizations and prose are production-quality.',
                },
            ]),
            termination: endorsement(1),
            credentialProjection: {
                achievementType: 'data-portfolio',
                criteria:
                    'Published a mentor-endorsed portfolio piece with SQL, Python, stats, and EDA work.',
            },
        },
    ],
    edges: [
        // SQL chain feeds its review, which feeds destination.
        { from: 'sql-practice', to: 'review-sql' },
        { from: 'review-sql', to: 'mentor-accept' },
        // Python practice feeds the stats review (crossing disciplines on purpose)
        // and the destination fan-in.
        { from: 'python-practice', to: 'review-stats' },
        { from: 'review-stats', to: 'mentor-accept' },
        // Independent feeds into the destination.
        { from: 'coursera-module', to: 'mentor-accept' },
        { from: 'stats-foundations', to: 'mentor-accept' },
        { from: 'draft-writeup', to: 'mentor-accept' },
    ],
    destinationSlug: 'mentor-accept',
};

// -----------------------------------------------------------------
// Bundle builder
// -----------------------------------------------------------------

const WHAT_IF_TEMPLATE_REF = 'showcase-what-if-v1';

export const buildWhatIfShowcase = (
    opts: BuildShowcaseOptions,
): ShowcaseBundle =>
    assembleBundle({
        ...opts,
        specs: [PRIMARY_SPEC, STATS_SPEC],
        primarySlug: PRIMARY_SPEC.slug,
        templateRef: WHAT_IF_TEMPLATE_REF,
    });

// -----------------------------------------------------------------
// Preview + definition
// -----------------------------------------------------------------

/**
 * Card-level metadata. Kept in sync with the realized bundle via a
 * test that re-counts totals and asserts on them.
 */
export const WHAT_IF_PREVIEW: ShowcasePreview = {
    title: PRIMARY_SPEC.title,
    description:
        'A data-analyst portfolio sprint wired for the What-If surface: practice, reviews, a Coursera module, a nested sub-pathway, and a fan-in destination.',
    audience: 'Workforce · Data',
    subPathwayCount: 1,
    totalStepCount: PRIMARY_SPEC.nodes.length + STATS_SPEC.nodes.length,
    featureTags: [
        'What-If scenarios',
        'Composite sub-pathway',
        'Fan-in destination',
        'Mixed policy kinds',
    ],
};

export const WHAT_IF_SHOWCASE: ShowcaseDefinition = {
    id: WHAT_IF_TEMPLATE_REF,
    preview: WHAT_IF_PREVIEW,
    build: buildWhatIfShowcase,
};
