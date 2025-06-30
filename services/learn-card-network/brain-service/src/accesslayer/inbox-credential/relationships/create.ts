import { QueryBuilder, BindParam } from 'neogma';
import { Profile, InboxCredential } from '@models';

export const createDeliveredRelationship = async (
    profileDid: string,
    inboxCredentialId: string,
    recipientDid: string,
    deliveryMethod: string = 'direct'
): Promise<boolean> => {
    const timestamp = new Date().toISOString();
    
    const result = await new QueryBuilder(new BindParam({ 
        profileDid, 
        inboxCredentialId, 
        timestamp, 
        recipientDid, 
        deliveryMethod 
    }))
        .match({ model: Profile, identifier: 'profile', where: { did: '$profileDid' } })
        .match({ model: InboxCredential, identifier: 'inboxCredential', where: { id: '$inboxCredentialId' } })
        .create('(profile)-[:DELIVERED_INBOX_CREDENTIAL { timestamp: $timestamp, recipientDid: $recipientDid, deliveryMethod: $deliveryMethod }]->(inboxCredential)')
        .return('profile')
        .run();

    return result.records.length > 0;
};

export const createClaimedRelationship = async (
    profileId: string,
    inboxCredentialId: string,
    claimToken: string
): Promise<boolean> => {
    const timestamp = new Date().toISOString();
    
    const result = await new QueryBuilder(new BindParam({ 
        profileId, 
        inboxCredentialId, 
        timestamp, 
        claimToken 
    }))
        .match({ model: Profile, identifier: 'profile'})
        .where('profile.profileId = $profileId')
        .match({ model: InboxCredential, identifier: 'inboxCredential'})
        .where('inboxCredential.id = $inboxCredentialId')
        .create('(profile)-[:CLAIMED_INBOX_CREDENTIAL { timestamp: $timestamp, claimToken: $claimToken }]->(inboxCredential)')
        .return('profile')
        .run();

    return result.records.length > 0;
};

export const createEmailSentRelationship = async (
    profileDid: string,
    inboxCredentialId: string,
    emailAddress: string,
    token: string
): Promise<boolean> => {
    const timestamp = new Date().toISOString();
    
    const result = await new QueryBuilder(new BindParam({ 
        profileDid, 
        inboxCredentialId, 
        timestamp, 
        emailAddress, 
        token 
    }))
        .match({ model: Profile, identifier: 'profile', where: { did: '$profileDid' } })
        .match({ model: InboxCredential, identifier: 'inboxCredential', where: { id: '$inboxCredentialId' } })
        .create('(profile)-[:SENT_EMAIL { timestamp: $timestamp, emailAddress: $emailAddress, token: $token }]->(inboxCredential)')
        .return('profile')
        .run();

    return result.records.length > 0;
};

export const createWebhookSentRelationship = async (
    profileDid: string,
    inboxCredentialId: string,
    url: string,
    status: string,
    response?: string
): Promise<boolean> => {
    const timestamp = new Date().toISOString();
    
    const result = await new QueryBuilder(new BindParam({ 
        profileDid, 
        inboxCredentialId, 
        timestamp, 
        url, 
        status,
        response: response || null
    }))
        .match({ model: Profile, identifier: 'profile', where: { did: '$profileDid' } })
        .match({ model: InboxCredential, identifier: 'inboxCredential', where: { id: '$inboxCredentialId' } })
        .create('(profile)-[:SENT_WEBHOOK { timestamp: $timestamp, url: $url, status: $status, response: $response }]->(inboxCredential)')
        .return('profile')
        .run();

    return result.records.length > 0;
};

export const createExpiredRelationship = async (
    profileDid: string,
    inboxCredentialId: string
): Promise<boolean> => {
    const timestamp = new Date().toISOString();
    
    const result = await new QueryBuilder(new BindParam({ 
        profileDid, 
        inboxCredentialId, 
        timestamp 
    }))
        .match({ model: Profile, identifier: 'profile', where: { did: '$profileDid' } })
        .match({ model: InboxCredential, identifier: 'inboxCredential', where: { id: '$inboxCredentialId' } })
        .create('(profile)-[:EXPIRED_INBOX_CREDENTIAL { timestamp: $timestamp }]->(inboxCredential)')
        .return('profile')
        .run();

    return result.records.length > 0;
};