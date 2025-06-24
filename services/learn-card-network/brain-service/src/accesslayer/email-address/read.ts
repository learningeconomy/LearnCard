import { QueryBuilder, BindParam } from 'neogma';
import { EmailAddress, Profile } from '@models';
import { EmailAddressType } from 'types/email-address';
import { ProfileType } from 'types/profile';
import { inflateObject } from '@helpers/objects.helpers';

export const getEmailAddressByEmail = async (email: string): Promise<EmailAddressType | null> => {
    const result = await new QueryBuilder()
        .match({
            model: EmailAddress,
            identifier: 'emailAddress',
            where: { email },
        })
        .return('emailAddress')
        .limit(1)
        .run();

    const emailAddress = result.records[0]?.get('emailAddress').properties;

    if (!emailAddress) return null;

    return emailAddress as EmailAddressType;
};

export const getEmailAddressById = async (id: string): Promise<EmailAddressType | null> => {
    const result = await new QueryBuilder()
        .match({
            model: EmailAddress,
            identifier: 'emailAddress',
            where: { id },
        })
        .return('emailAddress')
        .limit(1)
        .run();

    const emailAddress = result.records[0]?.get('emailAddress').properties;

    if (!emailAddress) return null;

    return emailAddress as EmailAddressType;
};

export const getEmailAddressesForProfile = async (profileDid: string): Promise<EmailAddressType[]> => {
    const result = await new QueryBuilder(new BindParam({ profileDid }))
        .match({ model: Profile, identifier: 'profile', where: { did: '$profileDid' } })
        .match('(profile)-[:HAS_EMAIL]->(emailAddress:EmailAddress)')
        .return('emailAddress')
        .run();

    return result.records.map(record => record.get('emailAddress').properties as EmailAddressType);
};

export const getProfileByEmailAddress = async (emailAddress: EmailAddressType): Promise<ProfileType | null> => {
    const result = await new QueryBuilder(new BindParam({ emailId: emailAddress.id }))
        .match({ model: EmailAddress, identifier: 'emailAddress', where: { id: '$emailId' } })
        .match('(profile:Profile)-[:HAS_EMAIL]->(emailAddress)')
        .return('profile')
        .limit(1)
        .run();

    const profile = result.records[0]?.get('profile').properties;

    if (!profile) return null;

    return inflateObject<ProfileType>(profile as any);
};

export const checkIfEmailIsVerified = async (email: string): Promise<boolean> => {
    const emailAddress = await getEmailAddressByEmail(email);
    return emailAddress?.isVerified ?? false;
};