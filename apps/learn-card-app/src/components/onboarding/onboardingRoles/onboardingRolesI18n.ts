/**
 * Render-layer i18n helpers for LearnCard roles.
 *
 * Role titles + descriptions live as static English strings in
 * `onboarding.helpers.ts` (`LearnCardRoles`), a framework-free `.ts` data file
 * whose English `title` is also used as an identifier (and is matched verbatim
 * by other code). Per the LC-1831 data-file pattern we must NOT import Paraglide
 * into that data file, so we translate ONLY at the render layer, keyed by the
 * role's `LearnCardRolesEnum`. The translations themselves live under the
 * existing `onboarding.role.*` catalog namespace (reused, not duplicated).
 *
 * This mirrors the LEVEL_KEYS / CHECKLIST_TITLE_KEYS pattern (see
 * SkillProficiencyBar.tsx, CheckListItem.tsx).
 */
import * as m from '../../../paraglide/messages.js';
import type { SupportedLanguage } from '../../../i18n';
import { LearnCardRolesEnum } from '../onboarding.helpers';

// Role enum → catalog key under `onboarding.role.*`. The enum values already
// match the catalog sub-keys (learner / guardian / teacher / admin / counselor
// / developer), so this is effectively an identity map, but kept explicit so a
// future enum rename can't silently desync from the catalog.
const ROLE_KEY: Record<LearnCardRolesEnum, string> = {
    [LearnCardRolesEnum.learner]: 'learner',
    [LearnCardRolesEnum.guardian]: 'guardian',
    [LearnCardRolesEnum.teacher]: 'teacher',
    [LearnCardRolesEnum.admin]: 'admin',
    [LearnCardRolesEnum.counselor]: 'counselor',
    [LearnCardRolesEnum.developer]: 'developer',
};

const tMsg = (key: string, locale?: SupportedLanguage): string => {
    const fn = (m as Record<string, unknown>)[key];
    return typeof fn === 'function'
        ? (
              fn as (
                  inputs?: Record<string, never>,
                  options?: { locale?: SupportedLanguage }
              ) => string
          )({}, locale ? { locale } : undefined)
        : '';
};

/** Translated display title for a role. */
export const getRoleTitle = (role: LearnCardRolesEnum, locale?: SupportedLanguage): string =>
    tMsg(`onboarding.role.${ROLE_KEY[role]}.title`, locale);

/** Translated description for a role. */
export const getRoleDescription = (role: LearnCardRolesEnum, locale?: SupportedLanguage): string =>
    tMsg(`onboarding.role.${ROLE_KEY[role]}.description`, locale);
