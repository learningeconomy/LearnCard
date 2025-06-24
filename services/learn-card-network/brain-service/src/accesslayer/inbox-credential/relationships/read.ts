import { QueryBuilder, BindParam } from 'neogma';
import { Profile, InboxCredential } from '@models';

export const getInboxCredentialClaimHistory = async (inboxCredentialId: string) => {
    const result = await new QueryBuilder(new BindParam({ inboxCredentialId }))
        .match({ model: InboxCredential, identifier: 'inboxCredential', where: { id: '$inboxCredentialId' } })
        .match('(profile:Profile)-[rel:CLAIMED_INBOX_CREDENTIAL]->(inboxCredential)')
        .return('profile, rel')
        .run();

    return result.records.map(record => ({
        profile: record.get('profile').properties,
        relationship: record.get('rel').properties,
    }));
};

export const getInboxCredentialDeliveryHistory = async (inboxCredentialId: string) => {
    const result = await new QueryBuilder(new BindParam({ inboxCredentialId }))
        .match({ model: InboxCredential, identifier: 'inboxCredential', where: { id: '$inboxCredentialId' } })
        .match('(profile:Profile)-[rel:DELIVERED_INBOX_CREDENTIAL]->(inboxCredential)')
        .return('profile, rel')
        .run();

    return result.records.map(record => ({
        profile: record.get('profile').properties,
        relationship: record.get('rel').properties,
    }));
};

export const getInboxCredentialEmailHistory = async (inboxCredentialId: string) => {
    const result = await new QueryBuilder(new BindParam({ inboxCredentialId }))
        .match({ model: InboxCredential, identifier: 'inboxCredential', where: { id: '$inboxCredentialId' } })
        .match('(profile:Profile)-[rel:SENT_EMAIL]->(inboxCredential)')
        .return('profile, rel')
        .orderBy('rel.timestamp DESC')
        .run();

    return result.records.map(record => ({
        profile: record.get('profile').properties,
        relationship: record.get('rel').properties,
    }));
};

export const getInboxCredentialWebhookHistory = async (inboxCredentialId: string) => {
    const result = await new QueryBuilder(new BindParam({ inboxCredentialId }))
        .match({ model: InboxCredential, identifier: 'inboxCredential', where: { id: '$inboxCredentialId' } })
        .match('(profile:Profile)-[rel:SENT_WEBHOOK]->(inboxCredential)')
        .return('profile, rel')
        .orderBy('rel.timestamp DESC')
        .run();

    return result.records.map(record => ({
        profile: record.get('profile').properties,
        relationship: record.get('rel').properties,
    }));
};

export const checkIfInboxCredentialWasClaimed = async (
    inboxCredentialId: string,
    profileDid: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ inboxCredentialId, profileDid }))
        .match({ model: Profile, identifier: 'profile', where: { did: '$profileDid' } })
        .match({ model: InboxCredential, identifier: 'inboxCredential', where: { id: '$inboxCredentialId' } })
        .match('(profile)-[:CLAIMED_INBOX_CREDENTIAL]->(inboxCredential)')
        .return('profile')
        .limit(1)
        .run();

    return result.records.length > 0;
};