import { getAllFixtures } from '@learncard/credential-library';
import type { SampleVC } from '@learncard/render-method-designer';

/**
 * All credential-library fixtures exposed to the render-method-designer. Ordered by fixture id
 * for stable dropdowns and predictable screenshots / QA steps.
 */
export const getAllSamples = (): SampleVC[] => {
    return [...getAllFixtures()]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(fixture => ({
            id: fixture.id,
            name: fixture.name,
            credential: fixture.credential,
        }));
};
