/**
 * Dev seed — instantiate the first curated template so local testing
 * doesn't require clicking through onboarding every time.
 *
 * Callers guard with `import.meta.env.DEV`. This is not a product
 * behavior; it is scaffolding purely for the local dev loop.
 */

import { pathwayStore } from '../../../stores/pathways';

import { CURATED_TEMPLATES, instantiateTemplate } from '../onboard/templates';

export const seedDemoPathwayIfEmpty = (learnerDid: string): void => {
    const hasAny = Object.keys(pathwayStore.get.pathways()).length > 0;

    if (hasAny) return;

    const template = CURATED_TEMPLATES[0];
    const now = new Date().toISOString();

    const pathway = instantiateTemplate(template, { ownerDid: learnerDid, now });

    pathwayStore.set.upsertPathway(pathway);
    pathwayStore.set.setActivePathway(pathway.id);
};
