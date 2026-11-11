import type { ClrLayoutKind, ClrSectionKind } from 'learn-card-base/helpers/credentials/clr/layout';
import * as m from '../../paraglide/messages.js';

/** Resolve labels at render time so locale switches never retain stale text. */
export const getClrSectionLabel = (kind: ClrSectionKind, layout: ClrLayoutKind): string => {
    switch (kind) {
        case 'training':
            return m['clrRenderer.training']();
        case 'courses':
            return m['clrRenderer.courses']();
        case 'programs':
            return m['clrRenderer.programs']();
        case 'activities':
            return layout === 'military'
                ? m['clrRenderer.fieldwork']()
                : m['clrRenderer.activities']();
        case 'assessments':
            return m['clrRenderer.assessments']();
        case 'competencies':
            return m['clrRenderer.competencies']();
        case 'qualifications':
            return m['clrRenderer.qualifications']();
        case 'awards':
            return m['clrRenderer.awards']();
        case 'other':
            return m['clrRenderer.other']();
    }
};
export const getClrLayoutLabel = (layout: 'military' | 'general'): string =>
    layout === 'military' ? m['clrRenderer.military']() : m['clrRenderer.general']();
