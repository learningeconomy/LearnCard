/**
 * Extracts credential metadata (name, achievementType) from a stored credential JSON string.
 * Used across guardian approval/rejection flows to populate notification data.
 */
export function parseCredentialMeta(credentialJson: string): {
    credentialName?: string;
    achievementType?: string;
} {
    try {
        const parsed = JSON.parse(credentialJson);
        const credentialName: string | undefined =
            parsed?.name ?? parsed?.credentialSubject?.achievement?.name;
        const subject = Array.isArray(parsed?.credentialSubject)
            ? parsed.credentialSubject[0]
            : parsed?.credentialSubject;
        const achievementType: string | undefined = subject?.achievement?.achievementType;
        return { credentialName, achievementType };
    } catch {
        return {};
    }
}
