/**
 * Render-layer i18n helpers for the Resume Builder.
 *
 * The section labels (`RESUME_SECTIONS`) and personal-info field labels /
 * placeholders (`resumeUserInfo`) live as static English strings in
 * `resume-builder.helpers.ts`, which is a framework-free `.ts` DATA file. Per
 * the LC-1831 data-file pattern we MUST NOT import Paraglide there or call
 * `m[...]()` at module load — and several of those English strings double as
 * stable identifiers when (de)serializing the LER-RS resume credential
 * (e.g. `getResumeDisplaySummary` / `buildResumeBuilderSnapshotFromLerVc`
 * match narrative names like "Professional Title" by their English value).
 *
 * So we translate ONLY at the render layer, keyed by the stable enum value.
 * This mirrors personalizationI18n.tsx and the LEVEL_KEYS pattern elsewhere.
 */
import * as m from '../../paraglide/messages.js';
import { UserInfoEnum, ResumeSectionKey } from './resume-builder.helpers';

const tMsg = (key: string, params?: Record<string, unknown>): string => {
    const fn = (m as Record<string, unknown>)[key];
    return typeof fn === 'function' ? (fn as (p?: Record<string, unknown>) => string)(params) : '';
};

export const getOnOffLabel = (on: boolean): string =>
    on ? m['passport.resumeBuilder.on']() : m['passport.resumeBuilder.off']();

// ── Personal-info fields ────────────────────────────────────────────────
export const getUserInfoLabel = (key: UserInfoEnum): string =>
    tMsg(`passport.resumeBuilder.fields.${key}.label`);

export const getUserInfoPlaceholder = (key: UserInfoEnum): string =>
    tMsg(`passport.resumeBuilder.fields.${key}.placeholder`);

// ── Section labels ──────────────────────────────────────────────────────
export const getSectionLabel = (key: ResumeSectionKey): string =>
    tMsg(`passport.resumeBuilder.sections.${key}`);

// ── Empty-section placeholder copy ──────────────────────────────────────
export type EmptySectionCopy = {
    actionLabel: string;
    emphasis: string;
    /** Shared suffix that follows the bolded emphasis text. */
    descriptionSuffix: string;
};

const EMPTY_SECTION_KEYS: Record<string, string> = {
    workHistory: 'passport.resumeBuilder.emptySection.workHistory',
    learningHistory: 'passport.resumeBuilder.emptySection.learningHistory',
    achievement: 'passport.resumeBuilder.emptySection.achievement',
    accomplishment: 'passport.resumeBuilder.emptySection.accomplishment',
    accommodation: 'passport.resumeBuilder.emptySection.accommodation',
};

export const getEmptySectionCopy = (
    key: ResumeSectionKey,
    brand: string
): EmptySectionCopy | undefined => {
    const base = EMPTY_SECTION_KEYS[key];
    if (!base) return undefined;
    return {
        actionLabel: tMsg(`${base}.action`),
        emphasis: tMsg(`${base}.emphasis`),
        descriptionSuffix: m['passport.resumeBuilder.emptySection.descriptionSuffix']({ brand }),
    };
};
