import { getAllFixtures } from '@learncard/credential-library';
import type { SampleVC } from '@learncard/render-method-designer';

/**
 * Curated sample VCs for the designer's preview pane. The selection covers a representative
 * cross-section of credential shapes (minimal, full badge, render-method-tagged, multi-subject)
 * so the variable picker exercises shallow + nested + array fields. Order is the dropdown
 * order — first entry is the default selection.
 */
const PREFERRED_IDS = [
    'vc-v2/render-method-example',
    'obv3/full-badge',
    'obv3/minimal-badge',
    'vc-v2/education-degree',
    'vc-v2/multiple-subjects',
    'boost/basic',
];

export const getCuratedSamples = (): SampleVC[] => {
    const all = getAllFixtures();
    const byId = new Map(all.map(f => [f.id, f]));

    const samples: SampleVC[] = [];
    for (const id of PREFERRED_IDS) {
        const fixture = byId.get(id);
        if (!fixture) continue;
        samples.push({
            id: fixture.id,
            name: fixture.name,
            credential: fixture.credential,
        });
    }
    return samples;
};
