type HighlightedCredential = {
    credentialSubject?: unknown;
};

const ADMIN_ACHIEVEMENT_TYPES: Record<string, true> = {
    'ext:GlobalID': true,
    'ext:NetworkID': true,
};

export const isScoutPassCustomizationAdmin = (
    credentials: ReadonlyArray<HighlightedCredential>
): boolean =>
    credentials.some(credential => {
        const subject = credential.credentialSubject;
        if (!subject || typeof subject !== 'object' || Array.isArray(subject)) return false;

        const achievement = 'achievement' in subject ? subject.achievement : undefined;
        if (!achievement || typeof achievement !== 'object' || Array.isArray(achievement)) {
            return false;
        }

        const achievementType =
            'achievementType' in achievement ? achievement.achievementType : undefined;

        return (
            typeof achievementType === 'string' && ADMIN_ACHIEVEMENT_TYPES[achievementType] === true
        );
    });

export const getScoutPassAllowedBoostTypes = <T>(
    boostTypes: ReadonlyArray<T>,
    isAdmin: boolean
): ReadonlyArray<T> => (isAdmin || boostTypes.length <= 1 ? boostTypes : boostTypes.slice(0, 1));

export const resolveScoutPassBoostType = <T extends string>(
    boostTypes: ReadonlyArray<{ type: T }>,
    requestedType?: string
): T | undefined =>
    boostTypes.find(({ type }) => type === requestedType)?.type ?? boostTypes[0]?.type;
