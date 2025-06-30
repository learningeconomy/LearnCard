import { QueryBuilder, BindParam } from 'neogma';
import { EmailAddress } from '@models';
import { EmailAddressType } from 'types/email-address';

export const updateEmailAddress = async (
    id: string,
    updates: Partial<Omit<EmailAddressType, 'id' | 'email' | 'createdAt'>>
): Promise<EmailAddressType | null> => {
    const updateData = {
        ...updates,
        ...(updates.isVerified && !updates.verifiedAt ? { verifiedAt: new Date().toISOString() } : {}),
    };

    const result = await new QueryBuilder(
        new BindParam({ id, updates: updateData })
    )
        .match({ model: EmailAddress, identifier: 'emailAddress' })
        .where('emailAddress.id = $id')
        .set('emailAddress += $updates')
        .return('emailAddress')
        .limit(1)
        .run();

    const emailAddress = result.records[0]?.get('emailAddress').properties;

    if (!emailAddress) return null;

    return emailAddress as EmailAddressType;
};

export const verifyEmailAddress = async (id: string): Promise<EmailAddressType | null> => {
    return updateEmailAddress(id, {
        isVerified: true,
        verifiedAt: new Date().toISOString(),
    });
};

export const setPrimaryEmail = async (profileDid: string, emailId: string): Promise<boolean> => {
    // First, unset all primary emails for this profile
    await new QueryBuilder(new BindParam({ profileDid }))
        .match('(profile:Profile { did: $profileDid })-[:HAS_EMAIL]->(emailAddress:EmailAddress)')
        .set('emailAddress.isPrimary = false')
        .run();

    // Then set the specified email as primary
    const result = await new QueryBuilder(new BindParam({ profileDid, emailId }))
        .match('(profile:Profile { did: $profileDid })-[:HAS_EMAIL]->(emailAddress:EmailAddress { id: $emailId })')
        .set('emailAddress.isPrimary = true')
        .return('emailAddress')
        .limit(1)
        .run();

    return result.records.length > 0;
};