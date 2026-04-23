/**
 * Dev seed — instantiate curated templates so local testing doesn't
 * require clicking through onboarding every time.
 *
 * Seeds two pathways:
 *   1. The first curated template (primary demo pathway).
 *   2. A small "parent" pathway that composites #1 as its destination,
 *      exercising the composite/nested-pathway primitive end-to-end
 *      (PathwaySwitcher, CompositeNodeBody, rollupCompositeProgress,
 *      Map composite badge).
 *
 * Callers guard with `import.meta.env.DEV`. This is not a product
 * behavior; it is scaffolding purely for the local dev loop.
 */

import { pathwayStore } from '../../../stores/pathways';
import { addEdge, addNode, setAction, setPolicy, setTermination } from '../build/buildOps';
import {
    buildAppListingSnapshot,
    type ListingSnapshotInput,
} from '../core/appListingSnapshot';
import type { AppListingSnapshot, OutcomeSignal, Pathway } from '../types';
import { CURRENT_PATHWAY_SCHEMA_VERSION } from '../types';

import { CURATED_TEMPLATES, instantiateTemplate } from '../onboard/templates';

import { AWS_DEMO_LISTING_IDS } from './presetListings';

// ---------------------------------------------------------------------------
// Preset snapshots — mirror of `PATHWAY_DEMO_PRESET` in the brain-service
// seed script. Hand-keyed rather than fetched so the dev seed path stays
// fully offline. When the seed script changes the listing metadata, bump
// this table (and add semanticTags once that field ships on AppStoreListing).
//
// If these drift from the live listing the UI fall-back still works: the
// listing fetch in `useListingForNode` eventually refreshes. The snapshot
// just lets the Map + NodeDetail render the right name/tagline/icon
// *immediately*, and gives agents something to reason about without a hop.
// ---------------------------------------------------------------------------

const AWS_DEMO_PRESET_LISTINGS: Record<string, ListingSnapshotInput> = {
    [AWS_DEMO_LISTING_IDS.courseraEssentials]: {
        name: 'Coursera — AWS Cloud Essentials',
        category: 'Learning',
        launch_type: 'DIRECT_LINK',
        tagline: 'Learn the fundamentals of AWS cloud.',
        icon_url: 'https://cdn.filestackcontent.com/RXaNgRHTHCNr3meO1G0A',
    },
    [AWS_DEMO_LISTING_IDS.practiceStudio]: {
        name: 'AWS Practice Studio',
        category: 'Practice',
        launch_type: 'EMBEDDED_IFRAME',
        tagline: 'In-app AWS CCP practice questions.',
        icon_url: 'https://cdn.filestackcontent.com/erbcRQfTG2TktX2hcmLu',
    },
    [AWS_DEMO_LISTING_IDS.cloudCoach]: {
        name: 'Cloud Coach',
        category: 'Tutor',
        launch_type: 'AI_TUTOR',
        tagline: 'One-on-one AI tutor for AWS deep-dives.',
        icon_url: 'https://cdn.filestackcontent.com/aWUPGBPRFenRT9taokA6',
    },
};

/**
 * Build an `AppListingSnapshot` for a preset listing. Returns `null`
 * when the id isn't in the preset table or when the snapshot builder
 * refuses (missing display name). `null` is handled upstream: we
 * simply skip the snapshot and let the UI's live fetch fill in.
 */
const presetSnapshot = (listingId: string, now: string): AppListingSnapshot | null => {
    const preset = AWS_DEMO_PRESET_LISTINGS[listingId];

    if (!preset) return null;

    return buildAppListingSnapshot(preset, { now });
};

/**
 * Build a small parent pathway that references `child` via a composite
 * (inline-expandable) node. Used to demo nested pathways in dev.
 * Pure — no store access, no I/O.
 */
const buildCompositeParent = (child: Pathway, ownerDid: string, now: string): Pathway => {
    // Seed the parent with a single placeholder node via `addNode` so
    // node id, pathway id, createdAt/updatedAt, and defaults all come
    // from the same helper used everywhere else in Build mode.
    const seed: Pathway = {
        id: crypto.randomUUID(),
        ownerDid,
        revision: 0,
        schemaVersion: CURRENT_PATHWAY_SCHEMA_VERSION,
        title: 'Demo: Nested pathway parent',
        goal: `Complete "${child.title}" and reflect on it`,
        nodes: [],
        edges: [],
        status: 'active',
        visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
        source: 'authored',
        createdAt: now,
        updatedAt: now,
    };

    // Step 1: composite node referencing the child pathway. Using
    // setPolicy + setTermination atomically upholds the composite
    // invariant (policy.kind === 'composite' ⇔ termination.kind ===
    // 'pathway-completed' + matching refs).
    let next = addNode(seed, {
        title: `Finish ${child.title}`,
        description: `Complete the nested "${child.title}" pathway to unlock the reflection step.`,
    });

    const compositeNode = next.nodes[next.nodes.length - 1];

    next = setPolicy(next, compositeNode.id, {
        kind: 'composite',
        pathwayRef: child.id,
        renderStyle: 'inline-expandable',
    });

    next = setTermination(next, compositeNode.id, {
        kind: 'pathway-completed',
        pathwayRef: child.id,
    });

    // Step 2: a simple reflection node, gated behind the composite.
    next = addNode(next, {
        title: 'Write a one-paragraph reflection',
        description: 'What surprised you while completing the nested pathway?',
    });

    const reflectionNode = next.nodes[next.nodes.length - 1];

    // Prerequisite edge: reflection depends on composite completion.
    next = {
        ...next,
        edges: [
            ...next.edges,
            {
                id: crypto.randomUUID(),
                from: compositeNode.id,
                to: reflectionNode.id,
                type: 'prerequisite',
            },
        ],
        destinationNodeId: reflectionNode.id,
    };

    return next;
};

export const seedDemoPathwayIfEmpty = (learnerDid: string): void => {
    const hasAny = Object.keys(pathwayStore.get.pathways()).length > 0;

    if (hasAny) return;

    const template = CURATED_TEMPLATES[0];
    const now = new Date().toISOString();

    const pathway = instantiateTemplate(template, { ownerDid: learnerDid, now });

    // Upsert the child first so the parent's composite ref is
    // resolvable from the moment the parent lands in the store.
    pathwayStore.set.upsertPathway(pathway);

    const parent = buildCompositeParent(pathway, learnerDid, now);

    pathwayStore.set.upsertPathway(parent);

    // Keep the child pathway as the active one — learners land on
    // the "real" demo, while PathwaySwitcher exposes the composite
    // parent one dropdown click away.
    pathwayStore.set.setActivePathway(pathway.id);
};

// ---------------------------------------------------------------------------
// AWS Cloud Practitioner demo pathway (v0.5 showcase)
// ---------------------------------------------------------------------------
//
// A 5-node pathway authored to exercise every meaningful ActionDescriptor
// dispatch path the UI supports, plus an OutcomeSignal that the credential
// binder can auto-propose against once the terminal VC arrives. Intended
// to be seeded *after* `pnpm lc seed pathway-demo` has populated the
// matching listings (see `presetListings.ts` for ID derivation).
//
// Node / kind mapping:
//   1. Watch course     → `app-listing` (Coursera,      DIRECT_LINK)
//   2. Practice exam    → `app-listing` (Practice Studio, EMBEDDED_IFRAME)
//   3. AI coaching      → `app-listing` (Cloud Coach,     AI_TUTOR)
//   4. Schedule exam    → `external-url` (Pearson VUE scheduler, no listing)
//   5. Upload cert      → `kind: 'none'` — learner stays in NodeDetail
//
// The pathway-level OutcomeSignal is of kind `credential-received` and
// expects `AWSCertifiedCloudPractitioner`. When a VC with that type lands
// in the wallet, the binder emits a proposal (no LLM, no budget burn);
// learner commits. That's the full v0.5 loop in one demo.

const buildAwsCloudPractitionerDemo = (ownerDid: string, now: string): Pathway => {
    let pathway: Pathway = {
        id: crypto.randomUUID(),
        ownerDid,
        revision: 0,
        schemaVersion: CURRENT_PATHWAY_SCHEMA_VERSION,
        title: 'AWS Cloud Practitioner',
        // `goal` is the Pathway-level narrative (no separate `description`
        // field on the schema — that lives on individual nodes). Keep this
        // readable on the Today / Map header.
        goal: 'Earn the AWS Certified Cloud Practitioner credential — a recorded course, timed practice, AI coaching, a proctored exam, and the signed VC.',
        nodes: [],
        edges: [],
        status: 'active',
        visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
        source: 'authored',
        createdAt: now,
        updatedAt: now,
    };

    // --- Node 1: watch the Coursera course -------------------------------
    pathway = addNode(pathway, {
        title: 'Watch: AWS Cloud Essentials',
        description:
            'Work through the ~2-week Coursera course covering EC2, S3, IAM, and VPC fundamentals. Upload your completion certificate when you finish.',
    });
    const n1 = pathway.nodes[pathway.nodes.length - 1];

    pathway = setPolicy(pathway, n1.id, {
        kind: 'artifact',
        prompt: 'Upload a screenshot or PDF of your Coursera completion certificate.',
        expectedArtifact: 'image',
    });
    pathway = setTermination(pathway, n1.id, {
        kind: 'artifact-count',
        count: 1,
        artifactType: 'image',
    });
    {
        // Snapshot so the Map renders the right icon/name on first
        // paint (before the listing fetch resolves) and agents can
        // reason about this node without an RPC hop.
        const snap = presetSnapshot(AWS_DEMO_LISTING_IDS.courseraEssentials, now);

        pathway = setAction(pathway, n1.id, {
            kind: 'app-listing',
            listingId: AWS_DEMO_LISTING_IDS.courseraEssentials,
            ...(snap ? { snapshot: snap } : {}),
        });
    }

    // --- Node 2: practice exam (iframe) ----------------------------------
    pathway = addNode(pathway, {
        title: 'Practice: 5 timed exams in Practice Studio',
        description:
            'Take five timed practice exams in the embedded Practice Studio app. Aim for 80%+ before scheduling the real thing.',
    });
    const n2 = pathway.nodes[pathway.nodes.length - 1];

    pathway = setPolicy(pathway, n2.id, {
        kind: 'artifact',
        prompt: 'Log or screenshot each practice run; the app stores your score history.',
        expectedArtifact: 'text',
    });
    pathway = setTermination(pathway, n2.id, {
        kind: 'artifact-count',
        count: 5,
        artifactType: 'text',
    });
    {
        const snap = presetSnapshot(AWS_DEMO_LISTING_IDS.practiceStudio, now);

        pathway = setAction(pathway, n2.id, {
            kind: 'app-listing',
            listingId: AWS_DEMO_LISTING_IDS.practiceStudio,
            ...(snap ? { snapshot: snap } : {}),
        });
    }

    // --- Node 3: AI coach deep dive --------------------------------------
    pathway = addNode(pathway, {
        title: 'Deep dive: AI-coached gap close',
        description:
            'Use Cloud Coach to drill the topics your practice exams flagged as weak. IAM roles, VPC peering, and cost analyzers are common traps.',
    });
    const n3 = pathway.nodes[pathway.nodes.length - 1];

    pathway = setPolicy(pathway, n3.id, {
        kind: 'artifact',
        prompt: 'Jot down one thing the AI coach clarified that the recorded course didn\'t.',
        expectedArtifact: 'text',
    });
    pathway = setTermination(pathway, n3.id, {
        kind: 'self-attest',
        prompt: 'I used Cloud Coach to close my weakest topics.',
    });
    {
        const snap = presetSnapshot(AWS_DEMO_LISTING_IDS.cloudCoach, now);

        pathway = setAction(pathway, n3.id, {
            kind: 'app-listing',
            listingId: AWS_DEMO_LISTING_IDS.cloudCoach,
            ...(snap ? { snapshot: snap } : {}),
        });
    }

    // --- Node 4: schedule proctored exam (external) ----------------------
    pathway = addNode(pathway, {
        title: 'Schedule: book the proctored exam',
        description:
            'Book your AWS Certified Cloud Practitioner exam through Pearson VUE. Upload the scheduling confirmation email when done.',
    });
    const n4 = pathway.nodes[pathway.nodes.length - 1];

    pathway = setPolicy(pathway, n4.id, {
        kind: 'artifact',
        prompt: 'Upload your Pearson VUE scheduling confirmation.',
        expectedArtifact: 'image',
    });
    pathway = setTermination(pathway, n4.id, {
        kind: 'artifact-count',
        count: 1,
        artifactType: 'image',
    });
    pathway = setAction(pathway, n4.id, {
        kind: 'external-url',
        url: 'https://www.pearsonvue.com/us/en/aws.html',
    });

    // --- Node 5: upload the terminal credential --------------------------
    //
    // Action-less on purpose — the NodeDetail overlay *is* the destination.
    // The learner drops the AWS-issued VC into the wallet and this node's
    // evidence uploader. The pathway OutcomeSignal will separately
    // auto-propose a binding via the credential binder (see below), which
    // is the more interesting v0.5 path.
    pathway = addNode(pathway, {
        title: 'Upload: your AWS Cloud Practitioner credential',
        description:
            'Once AWS issues your credential, upload it here — this node completes when the VC lands in your wallet.',
    });
    const n5 = pathway.nodes[pathway.nodes.length - 1];

    // `ArtifactType` doesn't have a VC variant yet — PDF is the closest
    // honest match (AWS delivers the cert as a PDF, and the real VC path
    // runs through the OutcomeSignal binder below, not this node's
    // termination). Revisit once evidence types grow a first-class VC kind.
    pathway = setPolicy(pathway, n5.id, {
        kind: 'artifact',
        prompt: 'Upload your AWS-issued Cloud Practitioner credential (PDF or screenshot).',
        expectedArtifact: 'pdf',
    });
    pathway = setTermination(pathway, n5.id, {
        kind: 'artifact-count',
        count: 1,
        artifactType: 'pdf',
    });
    pathway = setAction(pathway, n5.id, { kind: 'none' });

    // --- Prerequisite chain + destination + outcome ----------------------
    pathway = addEdge(pathway, n1.id, n2.id);
    pathway = addEdge(pathway, n2.id, n3.id);
    pathway = addEdge(pathway, n3.id, n4.id);
    pathway = addEdge(pathway, n4.id, n5.id);

    // Pathway-level outcome: "did executing this pathway produce the
    // intended result?". Distinct from termination (did all nodes
    // complete?) — a learner can finish every node and fail the exam,
    // and vice versa. The binder watches for a matching VC and proposes
    // the binding; learner commits.
    const outcome: OutcomeSignal = {
        id: crypto.randomUUID(),
        label: 'Earned AWS Cloud Practitioner',
        description:
            'A verifiable credential asserting the AWS Certified Cloud Practitioner certification.',
        kind: 'credential-received',
        expectedCredentialType: 'AWSCertifiedCloudPractitioner',
        minTrustTier: 'trusted',
    };

    return {
        ...pathway,
        destinationNodeId: n5.id,
        outcomes: [outcome],
    };
};

/**
 * Seed the AWS Cloud Practitioner demo pathway. Idempotent by title —
 * if a pathway with the same title already exists for this learner,
 * we don't duplicate. Safe to call repeatedly from the dev seed panel.
 *
 * Does NOT seed listings — the pathway's `app-listing` actions point
 * at deterministic IDs (`AWS_DEMO_LISTING_IDS`) that
 * `pnpm lc seed pathway-demo` is responsible for populating in Neo4j.
 * If the listings aren't seeded, the CTAs still render (the UI just
 * routes to `/app/:id` pages that 404); seed them first for the full
 * demo story.
 */
export const seedAwsCloudPractitionerDemo = (learnerDid: string): Pathway => {
    const now = new Date().toISOString();

    const existing = Object.values(pathwayStore.get.pathways()).find(
        p => p.ownerDid === learnerDid && p.title === 'AWS Cloud Practitioner',
    );

    if (existing) return existing;

    const pathway = buildAwsCloudPractitionerDemo(learnerDid, now);

    pathwayStore.set.upsertPathway(pathway);
    pathwayStore.set.setActivePathway(pathway.id);

    return pathway;
};
