/**
 * Injects the `id` properties that 1EdTech's OBv3 JSON Schema marks as required but which
 * the template layer does not supply:
 *
 *   AchievementCredential.required = ["@context","id","type","credentialSubject","issuer","validFrom"]
 *   Achievement.required           = ["id","type","criteria","description","name"]
 *
 * @see https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json
 */
export const ensureObv3RequiredFields = (
    credential: Record<string, unknown>
): Record<string, unknown> => {
    if (typeof credential.id !== 'string' || !credential.id) {
        credential.id = `urn:uuid:${crypto.randomUUID()}`;
    }

    const subjects = Array.isArray(credential.credentialSubject)
        ? credential.credentialSubject
        : [credential.credentialSubject];

    subjects.forEach(subject => {
        if (!subject || typeof subject !== 'object') return;

        const achievement = (subject as Record<string, unknown>).achievement as
            | Record<string, unknown>
            | undefined;

        if (!achievement || typeof achievement !== 'object' || Array.isArray(achievement)) return;

        if (typeof achievement.id !== 'string' || !achievement.id) {
            achievement.id = `urn:uuid:${crypto.randomUUID()}`;
        }
    });

    return credential;
};
