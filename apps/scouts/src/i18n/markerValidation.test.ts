import { describe, expect, it } from 'vitest';

import {
    interpolationVariables,
    malformedInterpolations,
    markupMarkers,
} from '../../scripts/i18n-marker-validation.mjs';

describe('i18n marker validation', () => {
    it('only treats double braces as interpolation markers', () => {
        expect(interpolationVariables('{count} of {{total}}')).toEqual(['total']);
        expect(malformedInterpolations('{count} of {{total}}')).toEqual(['count']);
    });

    it('includes standalone markup in the marker signature', () => {
        expect(markupMarkers('Before <0>inside</0><1/> after')).toEqual(['</0>', '<0>', '<1/>']);
    });
});
