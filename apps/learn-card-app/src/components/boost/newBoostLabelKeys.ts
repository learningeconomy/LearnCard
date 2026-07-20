/**
 * Paraglide message keys for NewBoostButton's per-category "New X" labels.
 *
 * Kept in a module with NO `learn-card-base` import so `NewBoostButton.test.ts`
 * can validate every key resolves (the jsdom test env can't load the
 * learn-card-base barrel). `newBoostButtonI18n.ts` maps these onto
 * `CredentialCategoryEnum` for the component, and the component resolves them
 * via a dynamic `m[key]()` lookup that both i18n CI guards are blind to — so the
 * test is the safety net.
 */
export const NEW_BOOST_LABEL_KEYS = {
    learningHistory: 'boost.newBoost.study',
    workHistory: 'boost.newBoost.experience',
    accommodation: 'boost.newBoost.assistance',
    accomplishment: 'boost.newBoost.portfolio',
    socialBadge: 'boost.newBoost.boost',
    achievement: 'boost.newBoost.achievement',
    skill: 'boost.newBoost.skill',
    id: 'boost.newBoost.id',
    membership: 'boost.newBoost.membership',
    course: 'boost.newBoost.course',
    // Fallback for categories without a dedicated label key.
    generic: 'boost.newBoost.generic',
} as const;
