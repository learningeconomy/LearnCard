/**
 * Smart Start showcase — "skills → matched modules → credentials →
 * college AND first-job" end-to-end.
 *
 * ## Why this file exists
 *
 * The World Economic Forum's **Smart Start** program pairs high-school
 * learners (grades 10–12) with upskilling modules on Coursera, whose
 * credentials are recognized for hiring by a committed employer
 * network. LearnCard's pathways primitive already models every piece
 * of that arc (composites for the sub-programs, collections for the
 * badge bundles, endorsements for partner recognition, alignment refs
 * for employer recognition), so this showcase hand-authors the whole
 * pipeline as a four-pathway bundle that an author can import in one
 * click.
 *
 * The narrative mirrors the full Smart Start deployment arc:
 *
 *   Skills intake → WEF module matching → Coursera upskilling →
 *   Credential transcript → Partner-research review
 *   → (Common App applications AND Employer applications)
 *   → First offer (college seat OR first job)
 *
 * Every part of that sentence lands on a concrete pathway primitive.
 *
 * ## What it demonstrates that the Senior Year showcase does NOT
 *
 *   - **Dual-track destinations that converge.** The primary pathway
 *     has two parallel composite sub-pathways (Common App + Employer
 *     Applications), both of which feed a single terminal node
 *     ("first offer") — the first real demo of a route that can
 *     honestly route through either track.
 *   - **Partner endorsement with trusted issuers.** The mid-pipeline
 *     `research-review` node's termination is an `endorsement` with
 *     the d.school / Cambridge / WestEd DIDs pinned as
 *     `trustedIssuers`, which lets the trust tier lift from "peer"
 *     to "institution" on signature.
 *   - **Employer recognition via alignment refs.** Every Coursera
 *     module badge carries an `AlignmentRef` pointing at the "WEF
 *     Smart Start Employer Partner Network" — the same shape CTDL
 *     uses for `ceterms:alignsTo`, showing how hiring signals can
 *     travel through our projection layer.
 *   - **Skills intake as a first-class node.** Upstream of any
 *     module, the pathway has an explicit "what skills do you
 *     already have?" node — making matchability a pathway feature,
 *     not an out-of-band workflow.
 *
 * ## Narrative authenticity
 *
 * The program name ("Smart Start") and partner names (d.school,
 * Cambridge, WestEd) are lifted directly from the cofounder note;
 * the employer partner network is kept abstract ("Smart Start
 * Employer Partners") because the actual roster is commercially
 * sensitive. Module titles are grounded in Coursera's real WEF
 * Future Skills catalogue (AI fluency, data literacy, collaboration,
 * problem solving) so the demo reads as credible to anyone who's
 * spent time on WEF's publicly-listed upskilling tracks.
 */

import {
    artifactCount,
    artifactPolicy,
    assembleBundle,
    compositeRef,
    endorsement,
    pathwayCompletedRef,
    practicePolicy,
    selfAttest,
    type PathwaySpec,
} from './buildBundle';
import type { BuildShowcaseOptions, ShowcaseBundle, ShowcaseDefinition } from './types';

// ---------------------------------------------------------------------------
// Alignment constant — reused across every Coursera module badge so
// the "these creds are recognized for hiring" story holds up visually
// in the inspector.
// ---------------------------------------------------------------------------

const WEF_EMPLOYER_ALIGNMENT = {
    targetName: 'WEF Smart Start Employer Partner Network',
    targetFramework: 'World Economic Forum · Smart Start',
    targetUrl: 'https://www.weforum.org/agenda/2024/01/smart-start-future-of-work/',
} as const;

// -----------------------------------------------------------------
// Pathway B — "WEF Smart Start Modules (via Coursera)"
//
// The upskilling core. Orientation gates four module badges that
// share the same target (capstone), forming the Option-2
// shared-prereq collection the Map collapses into one card. Every
// badge carries the employer-alignment ref so the NodeDetail
// surfaces "recognized by Smart Start partners."
// -----------------------------------------------------------------

const WEF_MODULES_SPEC: PathwaySpec = {
    slug: 'wef-modules',
    title: 'WEF Smart Start Modules (via Coursera)',
    goal: 'Earn the Smart Start certificate recognized by the employer partner network',
    // No CTID — Smart Start isn't in CE (yet). We use sourceUri to
    // stamp the Coursera-ish provenance so the inspector can render
    // "from Coursera" provenance on the pathway-level chip.
    sourceUri: 'https://www.coursera.org/specializations/smart-start',
    nodes: [
        {
            slug: 'orientation',
            title: 'Smart Start orientation',
            description:
                'A short orientation module that sets expectations, introduces the employer partner network, and unlocks the four core tracks.',
            policy: artifactPolicy(
                'Attach your orientation completion certificate or take a screenshot of the Coursera badge page.',
                'link',
            ),
            termination: selfAttest('Orientation complete.'),
            sourceUri: 'https://www.coursera.org/learn/smart-start-orientation',
        },
        {
            slug: 'module-data-literacy',
            title: 'Data Literacy for the Future of Work',
            description:
                'Reading, interpreting, and reasoning about quantitative information. A baseline skill every partner employer asks for.',
            policy: artifactPolicy('Submit a link to your earned Coursera badge.', 'link'),
            termination: endorsement(1),
            credentialProjection: {
                achievementType: 'digital-badge',
                criteria: 'Earned the Smart Start Data Literacy badge on Coursera.',
                alignment: [WEF_EMPLOYER_ALIGNMENT],
            },
            sourceUri: 'https://www.coursera.org/learn/smart-start-data-literacy',
        },
        {
            slug: 'module-ai-fluency',
            title: 'AI Fluency',
            description:
                'Using AI tools responsibly in day-to-day work. Partner employers cite this as the #1 differentiator for new hires.',
            policy: artifactPolicy('Submit a link to your earned Coursera badge.', 'link'),
            termination: endorsement(1),
            credentialProjection: {
                achievementType: 'digital-badge',
                criteria: 'Earned the Smart Start AI Fluency badge on Coursera.',
                alignment: [WEF_EMPLOYER_ALIGNMENT],
            },
            sourceUri: 'https://www.coursera.org/learn/smart-start-ai-fluency',
        },
        {
            slug: 'module-collaboration',
            title: 'Collaboration & Communication',
            description:
                'Running effective meetings, giving feedback, writing clearly — the soft skills partner employers say are the hardest to hire for.',
            policy: artifactPolicy('Submit a link to your earned Coursera badge.', 'link'),
            termination: endorsement(1),
            credentialProjection: {
                achievementType: 'digital-badge',
                criteria: 'Earned the Smart Start Collaboration & Communication badge.',
                alignment: [WEF_EMPLOYER_ALIGNMENT],
            },
            sourceUri:
                'https://www.coursera.org/learn/smart-start-collaboration',
        },
        {
            slug: 'module-problem-solving',
            title: 'Problem Solving & Critical Thinking',
            description:
                'Framing ambiguous problems, generating options, and making defensible decisions — the durable analytical layer under every other Smart Start module.',
            policy: artifactPolicy('Submit a link to your earned Coursera badge.', 'link'),
            termination: endorsement(1),
            credentialProjection: {
                achievementType: 'digital-badge',
                criteria: 'Earned the Smart Start Problem Solving badge on Coursera.',
                alignment: [WEF_EMPLOYER_ALIGNMENT],
            },
            sourceUri:
                'https://www.coursera.org/learn/smart-start-problem-solving',
        },
        {
            slug: 'capstone',
            title: 'Smart Start capstone project',
            description:
                'A short original project applying all four skills to a real-world prompt. Reviewed by a Smart Start mentor.',
            policy: artifactPolicy(
                'Attach the link to your capstone submission (GitHub, Notion, Google Drive — anything visible to your mentor).',
                'link',
            ),
            termination: endorsement(1),
            credentialProjection: {
                achievementType: 'capstone',
                criteria:
                    'Completed a Smart Start capstone project combining all four foundational modules.',
                alignment: [WEF_EMPLOYER_ALIGNMENT],
            },
        },
        {
            slug: 'smart-start-cert',
            title: 'Smart Start Certificate',
            description:
                'The partner-recognized certificate, issued after the capstone is reviewed. This is the credential committed employers screen for.',
            policy: artifactPolicy(
                'Attach the WEF Smart Start certificate (PDF or credential URL).',
                'pdf',
            ),
            termination: selfAttest('Certificate issued.'),
            credentialProjection: {
                achievementType: 'micro-credential',
                criteria:
                    'Earned the four foundational Smart Start badges and completed the capstone.',
                alignment: [WEF_EMPLOYER_ALIGNMENT],
            },
        },
    ],
    edges: [
        // Orientation gates all four badges — same incoming set, same
        // outgoing target (capstone), same policy kind (artifact) →
        // detectCollections groups these into one "Earn 4 Smart
        // Start badges" card on the Map.
        { from: 'orientation', to: 'module-data-literacy' },
        { from: 'orientation', to: 'module-ai-fluency' },
        { from: 'orientation', to: 'module-collaboration' },
        { from: 'orientation', to: 'module-problem-solving' },
        // Fan-in to capstone (AND-gate).
        { from: 'module-data-literacy', to: 'capstone' },
        { from: 'module-ai-fluency', to: 'capstone' },
        { from: 'module-collaboration', to: 'capstone' },
        { from: 'module-problem-solving', to: 'capstone' },
        // Capstone → certificate.
        { from: 'capstone', to: 'smart-start-cert' },
    ],
    destinationSlug: 'smart-start-cert',
};

// -----------------------------------------------------------------
// Pathway C — "Common App College Applications"
//
// A compact college-applications sub-pathway. Linear-ish with a
// small fan-in at submission (profile / essay / rec + SAT all land
// at the submit step). Keeps the bundle grounded in reality: most
// students targeting Smart Start employers are ALSO applying to
// college in parallel.
// -----------------------------------------------------------------

const COMMON_APP_SPEC: PathwaySpec = {
    slug: 'common-app',
    title: 'Common App: College Applications',
    goal: 'Submit complete Common App applications to target colleges',
    nodes: [
        {
            slug: 'sat-act',
            title: 'Take the SAT or ACT',
            description:
                'Pick whichever test suits you best. A strong score remains table stakes for most selective programs.',
            policy: artifactPolicy('Attach your official score report.', 'pdf'),
            termination: selfAttest('Score submitted.'),
        },
        {
            slug: 'profile',
            title: 'Build your Common App profile',
            description:
                'Activities, honors, work experience, and — crucially — the Smart Start credentials you just earned.',
            policy: artifactPolicy(
                'Attach a screenshot of your finished profile or a Common App export.',
                'pdf',
            ),
            termination: selfAttest('Profile complete.'),
        },
        {
            slug: 'essay',
            title: 'Personal essay',
            description:
                'A 500–650 word essay threading your Smart Start learning, partner research, and career ambitions into one voice.',
            policy: artifactPolicy('Attach the final draft of your essay.'),
            termination: artifactCount(1),
        },
        {
            slug: 'teacher-rec',
            title: 'Teacher recommendation',
            description:
                'A teacher who has seen you stretch yourself — often one who helped with your Smart Start capstone.',
            policy: artifactPolicy(
                'Capture who you asked and which course / project they know you from.',
            ),
            termination: endorsement(1),
        },
        {
            slug: 'submit',
            title: 'Submit to five colleges',
            description:
                'The moment everything becomes real. Attach a confirmation link for each submission.',
            policy: artifactPolicy(
                'Attach a link (or confirmation email) for each college you submitted to.',
                'link',
            ),
            termination: artifactCount(5, 'link'),
            credentialProjection: {
                achievementType: 'milestone',
                criteria: 'Submitted Common App applications to five colleges.',
            },
        },
    ],
    edges: [
        // Linear build toward submission.
        { from: 'profile', to: 'essay' },
        { from: 'essay', to: 'teacher-rec' },
        { from: 'teacher-rec', to: 'submit' },
        // SAT feeds submission directly — students can work on it in
        // parallel with the essay / rec track.
        { from: 'sat-act', to: 'submit' },
    ],
    destinationSlug: 'submit',
};

// -----------------------------------------------------------------
// Pathway D — "Smart Start Employer Applications"
//
// The employment destination track. Exercises the `practice` policy
// (weekly interview prep) alongside the more common `artifact` nodes,
// so the bundle has a node that actually shows a cadence card on
// the Map.
// -----------------------------------------------------------------

const EMPLOYER_APPS_SPEC: PathwaySpec = {
    slug: 'employer-apps',
    title: 'Smart Start Employer Applications',
    goal: 'Apply to committed Smart Start employer partners with a full application package',
    nodes: [
        {
            slug: 'resume',
            title: 'Build a Smart Start resume',
            description:
                'A one-page resume that leads with your Smart Start certificate and the partner-aligned badges.',
            policy: artifactPolicy('Attach your resume as a PDF.', 'pdf'),
            termination: artifactCount(1, 'pdf'),
        },
        {
            slug: 'target-employers',
            title: 'Shortlist partner employers',
            description:
                'Pick five employers from the Smart Start partner network whose open roles match your badge set.',
            policy: artifactPolicy(
                'Write a short rationale for each of your five target employers.',
            ),
            termination: selfAttest('Shortlist complete.'),
        },
        {
            slug: 'interview-practice',
            title: 'Weekly interview practice',
            description:
                'Six weeks of mock interviews — a blend of behavioral, technical, and Smart Start-scenario questions.',
            policy: practicePolicy('weekly', 1),
            termination: selfAttest('Six weeks of practice complete.'),
        },
        {
            slug: 'portfolio-refine',
            title: 'Refine your portfolio for employer review',
            description:
                'Polish your Smart Start capstone, add context for each badge, and make the whole package reviewable in under five minutes.',
            policy: artifactPolicy('Attach the live portfolio URL.', 'link'),
            termination: artifactCount(1, 'link'),
        },
        {
            slug: 'apply',
            title: 'Submit five employer applications',
            description:
                'Send tailored applications to each of your five target employers from the Smart Start partner network.',
            policy: artifactPolicy(
                'Attach a confirmation link (application receipt or portal) for each submission.',
                'link',
            ),
            termination: artifactCount(5, 'link'),
            credentialProjection: {
                achievementType: 'milestone',
                criteria:
                    'Submitted five tailored applications to Smart Start partner employers.',
                alignment: [WEF_EMPLOYER_ALIGNMENT],
            },
        },
    ],
    edges: [
        // Resume → shortlist (you need one to make the other concrete).
        { from: 'resume', to: 'target-employers' },
        // Shortlist then branches into two parallel prep tracks
        // (interviewing + portfolio), both feeding the final
        // "submit five applications" destination.
        { from: 'target-employers', to: 'interview-practice' },
        { from: 'target-employers', to: 'portfolio-refine' },
        { from: 'interview-practice', to: 'apply' },
        { from: 'portfolio-refine', to: 'apply' },
    ],
    destinationSlug: 'apply',
};

// -----------------------------------------------------------------
// Pathway A — primary
//
// The whole arc from skills intake to first offer. Two composite
// nodes (college + employer) land in parallel as destination
// candidates; both feed a single terminal `first-offer` node so
// `computeSuggestedRoute` can honestly represent "either track
// gets you to the goal" as one route.
// -----------------------------------------------------------------

const PRIMARY_SPEC: PathwaySpec = {
    slug: 'smart-start-primary',
    title: 'Smart Start: From Skills to First Offer',
    goal: 'Turn your current skills into a partner-recognized credential and an offer — college seat, first job, or both',
    nodes: [
        {
            slug: 'skills-intake',
            title: 'Skills intake',
            description:
                'A short self-assessment that captures the skills you already have. Drives which Smart Start modules the program recommends.',
            policy: artifactPolicy(
                'Write a short list of three skills you want to carry into your first role, and three you want to build.',
            ),
            termination: selfAttest('Skills captured.'),
        },
        {
            slug: 'wef-match',
            title: 'Review your Smart Start module matches',
            description:
                'The program reviews your intake and surfaces the Coursera modules that close the biggest gap. You confirm which you want to run.',
            policy: artifactPolicy(
                'List the matched modules and the order you plan to complete them in.',
            ),
            termination: selfAttest('Module plan confirmed.'),
        },
        {
            slug: 'wef-modules-ref',
            title: 'Complete your WEF Smart Start modules',
            description:
                'The four-track Coursera upskilling program. Each badge is recognized by the Smart Start employer partner network.',
            policy: compositeRef('wef-modules', 'inline-expandable'),
            termination: pathwayCompletedRef('wef-modules'),
            sourceUri: 'https://www.coursera.org/specializations/smart-start',
        },
        {
            slug: 'transcript',
            title: 'Compile your credential transcript',
            description:
                'Pull your Smart Start certificate, school transcript, and any other artifacts into one reviewable package.',
            policy: artifactPolicy(
                'Attach a single document (or link) that collects your school transcript, Smart Start certificate, and any other supporting credentials.',
                'pdf',
            ),
            termination: artifactCount(1, 'pdf'),
            credentialProjection: {
                achievementType: 'transcript',
                criteria:
                    'Assembled a single-package transcript combining school, Smart Start, and external credentials.',
            },
        },
        {
            slug: 'research-review',
            title: 'Partner-research review session',
            description:
                'A feedback session with the Smart Start research partners (d.school, Cambridge, WestEd) to sharpen your narrative before applications.',
            // Endorsement with trusted institutional issuers — the
            // pathway lifts from peer to institution trust tier
            // when one of these DIDs signs off. (The DIDs here are
            // placeholders; production will inject real ones.)
            policy: artifactPolicy(
                'Attach notes or a recording from your research-review session.',
            ),
            termination: endorsement(1, [
                'did:example:dschool',
                'did:example:cambridge',
                'did:example:wested',
            ]),
            credentialProjection: {
                achievementType: 'research-review',
                criteria:
                    'Completed a feedback session with a Smart Start research partner.',
            },
        },
        {
            slug: 'college-apps-ref',
            title: 'Submit your college applications',
            description:
                'The Common App track — a parallel destination for learners who want to pair Smart Start with a university seat.',
            policy: compositeRef('common-app', 'inline-expandable'),
            termination: pathwayCompletedRef('common-app'),
        },
        {
            slug: 'employer-apps-ref',
            title: 'Apply to Smart Start partner employers',
            description:
                'The direct-to-work track — apply to committed Smart Start partners who recognize your Coursera credentials.',
            policy: compositeRef('employer-apps', 'inline-expandable'),
            termination: pathwayCompletedRef('employer-apps'),
        },
        {
            slug: 'first-offer',
            title: 'Accept your first offer',
            description:
                'A college seat, a first job, or — for the highest performers — both. Either way, the Smart Start arc is complete.',
            policy: artifactPolicy(
                'Capture the offer (screenshot, email, link) and a short reflection on what came next.',
            ),
            termination: selfAttest('Offer accepted.'),
            credentialProjection: {
                achievementType: 'milestone',
                criteria:
                    'Accepted a first offer — college seat or employment — after completing the Smart Start arc.',
            },
        },
    ],
    edges: [
        // Linear intake → matching → modules → transcript → review.
        { from: 'skills-intake', to: 'wef-match' },
        { from: 'wef-match', to: 'wef-modules-ref' },
        { from: 'wef-modules-ref', to: 'transcript' },
        { from: 'transcript', to: 'research-review' },
        // Partner review fans out into the two parallel
        // destination tracks (college + employer). This is the
        // "dual-track destinations that converge" shape — both
        // tracks feed the single terminal node.
        { from: 'research-review', to: 'college-apps-ref' },
        { from: 'research-review', to: 'employer-apps-ref' },
        { from: 'college-apps-ref', to: 'first-offer' },
        { from: 'employer-apps-ref', to: 'first-offer' },
    ],
    destinationSlug: 'first-offer',
};

// ---------------------------------------------------------------------------
// Assembler + public definition
// ---------------------------------------------------------------------------

/** Identifier stamped onto every pathway's `templateRef`. */
export const SMART_START_TEMPLATE_REF = 'showcase-smart-start-wef';

const ALL_SPECS: PathwaySpec[] = [
    PRIMARY_SPEC,
    WEF_MODULES_SPEC,
    COMMON_APP_SPEC,
    EMPLOYER_APPS_SPEC,
];

export const buildSmartStartShowcase = (opts: BuildShowcaseOptions): ShowcaseBundle =>
    assembleBundle({
        ...opts,
        specs: ALL_SPECS,
        primarySlug: PRIMARY_SPEC.slug,
        templateRef: SMART_START_TEMPLATE_REF,
    });

/** Card-level metadata — kept in sync with the bundle by a preview test. */
export const SMART_START_PREVIEW = {
    title: 'Smart Start: From Skills to First Offer',
    description:
        'The WEF Smart Start pipeline — skills intake into matched Coursera modules, recognized by partner employers, ending in a college seat or first job.',
    audience: 'Workforce · High school',
    subPathwayCount: 3,
    totalStepCount:
        PRIMARY_SPEC.nodes.length
        + WEF_MODULES_SPEC.nodes.length
        + COMMON_APP_SPEC.nodes.length
        + EMPLOYER_APPS_SPEC.nodes.length,
    featureTags: [
        'Dual-track destinations',
        'Employer alignment',
        'Partner endorsement',
        'Module collection',
    ] as const,
} as const;

export const SMART_START_SHOWCASE: ShowcaseDefinition = {
    id: SMART_START_TEMPLATE_REF,
    preview: SMART_START_PREVIEW,
    build: buildSmartStartShowcase,
};
