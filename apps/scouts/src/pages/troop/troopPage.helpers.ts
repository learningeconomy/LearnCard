export interface TroopRecipientIssuance {
    uri: string;
    received?: unknown;
    to: { profileId: string };
}

export const selectHolderRecipient = <T extends TroopRecipientIssuance>(
    recipients: T[] | undefined,
    profileId: string | undefined,
    credentialUri?: string
): T | undefined =>
    credentialUri
        ? recipients?.find(recipient => recipient.uri === credentialUri)
        : recipients?.find(recipient => recipient.to.profileId === profileId);

export const hasReachableMembers = (
    acceptedMemberCount: number | string,
    memberRows: readonly unknown[]
): boolean => Number(acceptedMemberCount) > 0 || memberRows.length > 0;
