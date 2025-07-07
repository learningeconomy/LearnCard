import { BindParam, QueryBuilder } from 'neogma';
import { ContactMethod, Profile } from '@models';
import { ContactMethodType } from '@learncard/types';
import { ProfileType } from 'types/profile';
import { inflateObject } from '@helpers/objects.helpers';

export const getContactMethodByValue = async (
    type: 'email' | 'phone',
    value: string
): Promise<ContactMethodType | null> => {
    const result = await new QueryBuilder(new BindParam({ type, value }))
        .match({
            model: ContactMethod,
            identifier: 'contactMethod',
        })
        .where('contactMethod.type = $type AND contactMethod.value = $value')
        .return('contactMethod')
        .limit(1)
        .run();

    const contactMethod = result.records[0]?.get('contactMethod').properties;

    if (!contactMethod) return null;

    return contactMethod as ContactMethodType;
};

export const getContactMethodById = async (id: string): Promise<ContactMethodType | null> => {
    const result = await new QueryBuilder(new BindParam({ id }))
        .match({
            model: ContactMethod,
            identifier: 'contactMethod',
        })
        .where('contactMethod.id = $id')
        .return('contactMethod')
        .limit(1)
        .run();

    const contactMethod = result.records[0]?.get('contactMethod').properties;

    if (!contactMethod) return null;

    return contactMethod as ContactMethodType;
};

export const getContactMethodsForProfile = async (
    profileDid: string
): Promise<ContactMethodType[]> => {
    const result = await new QueryBuilder(new BindParam({ profileDid }))
        .match({
            related: [
                {
                    model: Profile,
                    identifier: 'profile',
                },
                {
                    name: 'HAS_CONTACT_METHOD',
                    direction: 'out',
                },
                {
                    model: ContactMethod,
                    identifier: 'contactMethod',
                },
            ],
        })
        .where('profile.did = $profileDid')
        .return('contactMethod')
        .run();

    const contactMethods = result.records.map(record => record.get('contactMethod').properties);

    return contactMethods as ContactMethodType[];
};

export const getProfileByContactMethod = async (
    contactMethodId: string
): Promise<ProfileType | null> => {
    const result = await new QueryBuilder(new BindParam({ contactMethodId }))
        .match({
            related: [
                {
                    model: ContactMethod,
                    identifier: 'contactMethod',
                },
                {
                    name: 'HAS_CONTACT_METHOD',
                    direction: 'in',
                },
                {
                    model: Profile,
                    identifier: 'profile',
                },
            ],
        })
        .where('contactMethod.id = $contactMethodId')
        .return('profile')
        .run();

    const profile = result.records[0]?.get('profile').properties;

    if (!profile) return null;

    return inflateObject(profile) as ProfileType;
};

export const checkIfContactMethodIsVerified = async (
    type: 'email' | 'phone',
    value: string
): Promise<boolean> => {
    const contactMethod = await getContactMethodByValue(type, value);
    return contactMethod?.isVerified ?? false;
};