import type { VC } from '@learncard/types';

import { getVCDisplayCardVariant } from '../VCDisplayCard2';
import { LCCategoryEnum } from '../../../types';

const credentialWithDisplayType = (displayType: string): VC => ({ display: { displayType } } as VC);

describe('getVCDisplayCardVariant', () => {
    it('uses the ribbon layout for a generic credential', () => {
        expect(getVCDisplayCardVariant({} as VC)).toBe('ribbon');
    });

    it('detects each specialized display type', () => {
        expect(getVCDisplayCardVariant(credentialWithDisplayType('award'))).toBe('award');
        expect(getVCDisplayCardVariant(credentialWithDisplayType('certificate'))).toBe(
            'certificate'
        );
        expect(getVCDisplayCardVariant(credentialWithDisplayType('id'))).toBe('id');
    });

    it('uses category metadata when display metadata is absent', () => {
        expect(getVCDisplayCardVariant({} as VC, LCCategoryEnum.meritBadge)).toBe('award');
        expect(getVCDisplayCardVariant({} as VC, LCCategoryEnum.id)).toBe('id');
    });

    it('uses the formatted display type as a final fallback', () => {
        expect(getVCDisplayCardVariant({} as VC, undefined, 'Certificate')).toBe('certificate');
    });
});
