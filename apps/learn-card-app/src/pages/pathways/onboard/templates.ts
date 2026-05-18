/**
 * Curated pathway templates — hand-authored starting points for Phase 1.
 *
 * Audience wedge: **workforce transitioners** (docs § 17, product-pending
 * sign-off). The three templates below are tuned for learners moving
 * between careers and building evidence of transferable skills.
 *
 * Copy here is placeholder-quality; product polish is expected before
 * the first audience-release. The shapes, keywords, and node structure
 * are the architectural commitment.
 */

import { v4 as uuid } from 'uuid';

import { seedChosenRoute } from '../core/chosenRoute';
import type {
    AchievementProjection,
    Altitude,
    Edge,
    Pathway,
    PathwayNode,
    Policy,
    Termination,
} from '../types';
import { CURRENT_PATHWAY_SCHEMA_VERSION } from '../types';

// -----------------------------------------------------------------
// Template shape
// -----------------------------------------------------------------

interface TemplateNode {
    /** Stable within the template; NOT a real node id. */
    slug: string;
    title: string;
    description?: string;
    policy: Policy;
    termination: Termination;
    credentialProjection?: AchievementProjection;
}

interface TemplateEdge {
    from: string; // slug
    to: string; // slug
    type: Edge['type'];
}

export interface PathwayTemplate {
    id: string;
    title: string;
    goal: string;
    /** Shown under the title in the onboarding suggestion grid. */
    summary: string;
    /** Keywords matched against the learner's free-text goal. */
    keywords: readonly string[];
    /** Coarse tags (skills / roles / outcomes) for filtering. */
    tags: readonly string[];
    nodes: readonly TemplateNode[];
    edges: readonly TemplateEdge[];
    /**
     * Altitude this template is shaped for. Drives altitude-aware
     * ranking in `suggestPathways` — a learner arriving with a
     * question-altitude intent is offered the question-shaped
     * template at the top of the grid, not an aspiration-shaped one
     * that pattern-matched on a verb. Defaults to `'aspiration'`
     * (the pre-altitude behavior) when unset.
     */
    altitude?: Altitude;
    /**
     * Slug of the template's **destination** node — the final step
     * whose completion marks the pathway as done. When set, the
     * instantiated pathway carries a concrete `destinationNodeId`
     * and a seeded `chosenRoute` (entry → destination) so Today,
     * Map, and What-If all have the committed linear walk to
     * consult. Optional: older templates without a terminal still
     * work, they just miss out on turn-by-turn.
     *
     * Conventionally the destination slug is the node that carries
     * a `credentialProjection` — the "this is the artifact that
     * proves the pathway" step — because that's what the learner
     * is walking *toward*.
     */
    destinationSlug?: string;
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

const artifactPolicy = (prompt: string): Policy => ({
    kind: 'artifact',
    prompt,
    expectedArtifact: 'text',
});

const selfAttest = (prompt: string): Termination => ({ kind: 'self-attest', prompt });

const endorsementTermination = (
    minEndorsers: number,
    trustedIssuers?: string[],
): Termination => ({
    kind: 'endorsement',
    minEndorsers,
    ...(trustedIssuers ? { trustedIssuers } : {}),
});

// -----------------------------------------------------------------
// Templates
// -----------------------------------------------------------------

const PORTFOLIO_OF_TRANSFERABLE_SKILLS: PathwayTemplate = {
    id: 'tpl-portfolio-transferable-skills',
    title: 'Document your transferable skills',
    goal: 'Build a portfolio of evidence for skills that apply across roles',
    summary:
        'A short, structured pass over work you have already done — framed so the skills show up clearly.',
    keywords: [
        'career change',
        'transition',
        'pivot',
        'transferable skill',
        'portfolio',
        'evidence',
        'new role',
        'switch career',
    ],
    tags: ['career-transition', 'portfolio', 'self-assessment'],
    altitude: 'aspiration',
    destinationSlug: 'write-the-story',
    nodes: [
        {
            slug: 'name-three-skills',
            title: 'Name three skills you want to carry forward',
            description: 'Quick reflection. Narrow is better than broad.',
            policy: artifactPolicy(
                'Write a short list of three skills you want your next role to recognize.',
            ),
            termination: selfAttest('I named three skills.'),
        },
        {
            slug: 'evidence-per-skill',
            title: 'Find one piece of evidence per skill',
            description:
                'Past work, side projects, volunteering — anything concrete counts.',
            policy: artifactPolicy(
                'For each skill, attach a short description of the work that demonstrates it.',
            ),
            termination: {
                kind: 'artifact-count',
                count: 3,
                artifactType: 'text',
            },
        },
        {
            slug: 'write-the-story',
            title: 'Write a one-paragraph career story',
            description:
                'The version you would tell a sharp friend in 90 seconds.',
            policy: artifactPolicy(
                'Write 150–200 words that thread your three skills into a single narrative.',
            ),
            termination: selfAttest('The story is ready.'),
            credentialProjection: {
                achievementType: 'portfolio-piece',
                criteria:
                    'Published a coherent first-person career narrative connecting three chosen skills to concrete evidence.',
                alignment: [
                    {
                        targetName: 'Written communication',
                        targetFramework: 'ESCO',
                    },
                ],
            },
        },
    ],
    edges: [
        { from: 'name-three-skills', to: 'evidence-per-skill', type: 'prerequisite' },
        { from: 'evidence-per-skill', to: 'write-the-story', type: 'prerequisite' },
    ],
};

const PREPARE_FOR_INTERVIEWS: PathwayTemplate = {
    id: 'tpl-interview-prep',
    title: 'Prepare for a round of interviews',
    goal: 'Walk into interviews with rehearsed stories and calibrated answers',
    summary:
        'Structured practice — cases you can point to, questions you can answer without scrambling.',
    keywords: [
        'interview',
        'job search',
        'recruiter',
        'hiring',
        'stories',
        'prep',
        'practice',
        'technical interview',
    ],
    tags: ['interview-prep', 'job-search'],
    altitude: 'aspiration',
    destinationSlug: 'mentor-sign-off',
    nodes: [
        {
            slug: 'pick-target-roles',
            title: 'Pick two target roles',
            description: 'Specific enough to practice for.',
            policy: artifactPolicy(
                'Name two roles you would accept an offer from this month.',
            ),
            termination: selfAttest('Two roles chosen.'),
        },
        {
            slug: 'five-star-stories',
            title: 'Write five STAR stories',
            description:
                'Situation, Task, Action, Result. Reusable across most behavioral questions.',
            policy: artifactPolicy(
                'For each story, write a few sentences per STAR slot.',
            ),
            termination: {
                kind: 'artifact-count',
                count: 5,
                artifactType: 'text',
            },
        },
        {
            slug: 'mock-interview',
            title: 'Run one mock interview',
            description:
                'Live or async — a friend, a mentor, a recording of yourself talking to a prompt.',
            policy: artifactPolicy(
                'Attach the recording link or a written reflection of how it went.',
            ),
            termination: selfAttest('I ran one mock interview.'),
        },
        {
            slug: 'mentor-sign-off',
            title: 'Ask one mentor to read your stories',
            description:
                'An outside read catches the parts that sound obvious to you but opaque to anyone else.',
            policy: artifactPolicy(
                'Share the stories with someone you trust and attach their feedback.',
            ),
            termination: endorsementTermination(1),
            credentialProjection: {
                achievementType: 'interview-readiness',
                criteria:
                    'Completed STAR stories, mock interview, and mentor review of narrative material.',
            },
        },
    ],
    edges: [
        { from: 'pick-target-roles', to: 'five-star-stories', type: 'prerequisite' },
        { from: 'five-star-stories', to: 'mock-interview', type: 'prerequisite' },
        { from: 'five-star-stories', to: 'mentor-sign-off', type: 'prerequisite' },
    ],
};

const SHIP_A_PUBLIC_ARTIFACT: PathwayTemplate = {
    id: 'tpl-ship-public-artifact',
    title: 'Ship one public-facing artifact',
    goal: 'Put something out into the world that future employers can see',
    summary:
        'A single shippable thing — essay, demo, repo, short talk — scoped tight enough to actually finish.',
    keywords: [
        'portfolio',
        'writing',
        'publish',
        'ship',
        'essay',
        'project',
        'public',
        'demo',
        'side project',
    ],
    tags: ['portfolio', 'output', 'publishing'],
    altitude: 'aspiration',
    destinationSlug: 'publish',
    nodes: [
        {
            slug: 'scope-the-artifact',
            title: 'Scope one shippable thing',
            description:
                'Smaller than you think. Two weeks, not two months.',
            policy: artifactPolicy(
                'Write a one-paragraph scope: what the artifact is, who it is for, what "done" looks like.',
            ),
            termination: selfAttest('Scope defined.'),
        },
        {
            slug: 'draft',
            title: 'Make the first draft',
            description: 'Ugly is fine; done is the point.',
            policy: artifactPolicy(
                'Attach the draft. It does not have to be good yet.',
            ),
            termination: {
                kind: 'artifact-count',
                count: 1,
                artifactType: 'text',
            },
        },
        {
            slug: 'share-for-feedback',
            title: 'Share the draft with one reviewer',
            description:
                'Someone whose taste you trust and who will actually read it.',
            policy: artifactPolicy(
                'Capture the feedback you got. Summaries are fine.',
            ),
            termination: selfAttest('Feedback received.'),
        },
        {
            slug: 'publish',
            title: 'Publish',
            description:
                'A URL, a public post, a PR merged, a talk delivered. Something link-shaped.',
            policy: artifactPolicy(
                'Attach the public link and a short reflection on what you would do differently.',
            ),
            termination: selfAttest('Published.'),
            credentialProjection: {
                achievementType: 'shipped-artifact',
                criteria:
                    'Scoped, drafted, revised, and published one public-facing artifact with reflection attached.',
            },
        },
    ],
    edges: [
        { from: 'scope-the-artifact', to: 'draft', type: 'prerequisite' },
        { from: 'draft', to: 'share-for-feedback', type: 'prerequisite' },
        { from: 'share-for-feedback', to: 'publish', type: 'prerequisite' },
    ],
};

// -----------------------------------------------------------------
// Non-aspiration altitudes — one template each so learners arriving
// at question / action / exploration altitudes aren't force-funneled
// into career-transition templates that don't match their shape.
// -----------------------------------------------------------------

const FOLLOW_A_QUESTION: PathwayTemplate = {
    id: 'tpl-follow-a-question',
    title: 'Follow a question',
    goal: 'Chase a question down to a first answer',
    summary:
        'A short loop that takes a question you cannot stop thinking about, sharpens it, and produces a first written-up answer.',
    keywords: [
        'question',
        'how',
        'why',
        'what',
        'wonder',
        'curious',
        'inquiry',
    ],
    tags: ['inquiry', 'research', 'question'],
    altitude: 'question',
    destinationSlug: 'write-what-you-found',
    nodes: [
        {
            slug: 'sharpen-the-question',
            title: 'Sharpen the question',
            description:
                'The version you would ask a specialist — specific, answerable, worth the time to chase.',
            policy: artifactPolicy(
                'Write your question in one sentence. Then rewrite it once to make it sharper.',
            ),
            termination: selfAttest('Question is sharp enough to chase.'),
        },
        {
            slug: 'chase-first-source',
            title: 'Chase the first source',
            description:
                'A paper, a post, a chapter — whatever looks like it might have the answer or point at the next question.',
            policy: artifactPolicy(
                'Attach or cite the source you found and the part that actually addressed your question.',
            ),
            termination: {
                kind: 'artifact-count',
                count: 1,
                artifactType: 'text',
            },
        },
        {
            slug: 'write-what-you-found',
            title: 'Write up what you found',
            description:
                'A short write-up of what the source told you and what you still want to know next. The doubt-capture matters as much as the answer.',
            policy: artifactPolicy(
                'Write 100-200 words: what you asked, what you learned, and the next question it opened.',
            ),
            termination: selfAttest('Write-up complete.'),
            credentialProjection: {
                achievementType: 'inquiry-note',
                criteria:
                    'Sharpened a question, chased a first source, and captured the answer plus the next question.',
            },
        },
    ],
    edges: [
        { from: 'sharpen-the-question', to: 'chase-first-source', type: 'prerequisite' },
        { from: 'chase-first-source', to: 'write-what-you-found', type: 'prerequisite' },
    ],
};

const CAPTURE_TODAYS_WORK: PathwayTemplate = {
    id: 'tpl-capture-todays-work',
    title: "Capture today's work",
    goal: 'Do the thing today and record what happened',
    summary:
        'A lightweight pathway for when you already know what you want to do — support for the doing, plus a quick record of what came out of it.',
    keywords: [
        'today',
        'tonight',
        'this week',
        'right now',
        'session',
        'work session',
    ],
    tags: ['doing', 'session', 'action'],
    altitude: 'action',
    destinationSlug: 'note-what-you-noticed',
    nodes: [
        {
            slug: 'name-the-thing',
            title: 'Name the thing you are going to do',
            description:
                'One sentence. Small enough to actually finish in one session.',
            policy: artifactPolicy(
                'What specifically are you doing? Write it as a single sentence.',
            ),
            termination: selfAttest('I know what I am doing.'),
        },
        {
            slug: 'do-it',
            title: 'Do it',
            description:
                'Show up. Keep whatever came out of the session — the draft, the notes, the screenshot, the commit link.',
            policy: artifactPolicy(
                'Attach whatever came out of the session. Unpolished is fine; proof of showing up is the point.',
            ),
            termination: {
                kind: 'artifact-count',
                count: 1,
                artifactType: 'text',
            },
        },
        {
            slug: 'note-what-you-noticed',
            title: 'Note one thing you noticed',
            description:
                'What worked, what didn\'t, what surprised you. One sentence is enough.',
            policy: artifactPolicy(
                'Write one sentence about what you noticed while doing the work.',
            ),
            termination: selfAttest('Noticed and noted.'),
            credentialProjection: {
                achievementType: 'work-session',
                criteria:
                    'Named a concrete task, did it, and captured one observation.',
            },
        },
    ],
    edges: [
        { from: 'name-the-thing', to: 'do-it', type: 'prerequisite' },
        { from: 'do-it', to: 'note-what-you-noticed', type: 'prerequisite' },
    ],
};

const EXPLORE_AND_NOTICE: PathwayTemplate = {
    id: 'tpl-explore-and-notice',
    title: 'Explore and notice',
    goal: 'Follow the curiosity and see what starts to take shape',
    summary:
        'No destination required. A small loop that lets you sample an area, capture reactions, and watch a shape emerge from your own notes.',
    keywords: [
        'curious',
        'explore',
        'interested',
        'reading',
        'lately',
        'wondering',
        'noticing',
    ],
    tags: ['exploration', 'noticing', 'curiosity'],
    altitude: 'exploration',
    destinationSlug: 'name-the-shape',
    nodes: [
        {
            slug: 'sample-the-area',
            title: 'Sample the area',
            description:
                'Read, watch, or try something in the space you are drawn to. The goal is exposure, not mastery.',
            policy: artifactPolicy(
                'Attach what you looked at or link to it — a post, a paper, a tutorial, a conversation.',
            ),
            termination: {
                kind: 'artifact-count',
                count: 1,
                artifactType: 'text',
            },
        },
        {
            slug: 'capture-a-reaction',
            title: 'Capture a reaction',
            description:
                'What caught you? Bored you? Confused you? Write it down before it fades.',
            policy: artifactPolicy(
                'Write a short reaction: what pulled you in, what felt wrong, what you want more of.',
            ),
            termination: selfAttest('Reaction captured.'),
        },
        {
            slug: 'name-the-shape',
            title: 'Name the shape that is emerging',
            description:
                'After a few samples and reactions, what do you keep coming back to? No pressure to be right; pattern-naming is the practice.',
            policy: artifactPolicy(
                'Write one sentence that names the shape you are noticing in what you keep being drawn to.',
            ),
            termination: selfAttest('I can name the shape (for now).'),
            credentialProjection: {
                achievementType: 'exploration-note',
                criteria:
                    'Sampled an area of interest, captured reactions, and named the shape that was emerging.',
            },
        },
    ],
    edges: [
        { from: 'sample-the-area', to: 'capture-a-reaction', type: 'prerequisite' },
        { from: 'capture-a-reaction', to: 'name-the-shape', type: 'prerequisite' },
    ],
};

export const CURATED_TEMPLATES: readonly PathwayTemplate[] = [
    PORTFOLIO_OF_TRANSFERABLE_SKILLS,
    PREPARE_FOR_INTERVIEWS,
    SHIP_A_PUBLIC_ARTIFACT,
    FOLLOW_A_QUESTION,
    CAPTURE_TODAYS_WORK,
    EXPLORE_AND_NOTICE,
];

// -----------------------------------------------------------------
// Instantiation
// -----------------------------------------------------------------

/**
 * Freeze a template into a real `Pathway` with fresh UUIDs. Pure: takes
 * `now` and an id generator so tests can pin the output.
 */
export interface InstantiateOptions {
    ownerDid: string;
    now: string;
    /** Defaults to `uuid()`. Tests inject a deterministic generator. */
    makeId?: () => string;
    /**
     * The learner's own words for what they're working toward. When
     * provided (and non-empty), this becomes the pathway's `goal`
     * instead of the template's canonical goal — keeping the template
     * recoverable via `templateRef` for future pattern-matching while
     * making the visible goal feel personal (docs § 6).
     */
    learnerGoalText?: string;
    /**
     * Altitude the learner's input resolved to. Optional so older
     * call sites keep compiling; when omitted, falls back to the
     * template's own altitude (existing aspiration-shaped behavior).
     * Stored on the pathway so renderers — chiefly IdentityBanner —
     * can pick altitude-appropriate phrasing without re-running the
     * classifier.
     */
    intentAltitude?: Altitude;
}

export const instantiateTemplate = (
    template: PathwayTemplate,
    {
        ownerDid,
        now,
        makeId = uuid,
        learnerGoalText,
        intentAltitude,
    }: InstantiateOptions,
): Pathway => {
    const pathwayId = makeId();

    // Map template slugs → real node ids so edges can resolve.
    const slugToId: Record<string, string> = {};

    const nodes: PathwayNode[] = template.nodes.map(tn => {
        const id = makeId();
        slugToId[tn.slug] = id;

        return {
            id,
            pathwayId,
            title: tn.title,
            description: tn.description,
            stage: {
                initiation: [],
                policy: tn.policy,
                termination: tn.termination,
            },
            credentialProjection: tn.credentialProjection,
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
        };
    });

    const edges: Edge[] = template.edges.map(te => ({
        id: makeId(),
        from: slugToId[te.from],
        to: slugToId[te.to],
        type: te.type,
    }));

    const learnerGoalTrimmed = learnerGoalText?.trim() ?? '';

    // Prefer the classifier's live read of the learner's input, but
    // fall back to the template's own altitude so pathways created
    // without a classification (older call sites, seeds, tests) still
    // carry a usable altitude for downstream renderers.
    const resolvedAltitude: Altitude | undefined =
        intentAltitude ?? template.altitude;

    // Resolve the template's destination slug to a concrete node id.
    // Templates without a named destination produce a pathway with no
    // `destinationNodeId`, which in turn produces no seeded
    // `chosenRoute` — Today falls back to ranking, Map hides the
    // route ribbon. That's the honest shape for a
    // "no-terminal-authored" template.
    const destinationNodeId = template.destinationSlug
        ? slugToId[template.destinationSlug]
        : undefined;

    const pathway: Pathway = {
        id: pathwayId,
        ownerDid,
        revision: 0,
        schemaVersion: CURRENT_PATHWAY_SCHEMA_VERSION,
        title: template.title,
        goal: learnerGoalTrimmed.length > 0 ? learnerGoalTrimmed : template.goal,
        ...(resolvedAltitude ? { intentAltitude: resolvedAltitude } : {}),
        nodes,
        edges,
        status: 'active',
        visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
        source: 'template',
        templateRef: template.id,
        ...(destinationNodeId ? { destinationNodeId } : {}),
        createdAt: now,
        updatedAt: now,
    };

    // Seed chosenRoute now that the pathway shape is final. Templates
    // that name a `destinationSlug` produce a seeded walk from entry
    // to destination; templates without one fall back to `undefined`
    // so Today uses ranking rather than committing to a route the
    // graph can't honestly derive.
    const seededRoute = seedChosenRoute(pathway);

    return seededRoute.length > 0 ? { ...pathway, chosenRoute: seededRoute } : pathway;
};
