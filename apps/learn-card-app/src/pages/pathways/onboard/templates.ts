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

import type {
    AchievementProjection,
    Edge,
    Pathway,
    PathwayNode,
    Policy,
    Termination,
} from '../types';

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

export const CURATED_TEMPLATES: readonly PathwayTemplate[] = [
    PORTFOLIO_OF_TRANSFERABLE_SKILLS,
    PREPARE_FOR_INTERVIEWS,
    SHIP_A_PUBLIC_ARTIFACT,
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
}

export const instantiateTemplate = (
    template: PathwayTemplate,
    { ownerDid, now, makeId = uuid, learnerGoalText }: InstantiateOptions,
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

    return {
        id: pathwayId,
        ownerDid,
        title: template.title,
        goal: learnerGoalTrimmed.length > 0 ? learnerGoalTrimmed : template.goal,
        nodes,
        edges,
        status: 'active',
        visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
        source: 'template',
        templateRef: template.id,
        createdAt: now,
        updatedAt: now,
    };
};
