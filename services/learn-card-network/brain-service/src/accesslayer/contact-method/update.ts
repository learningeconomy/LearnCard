import { QueryBuilder, BindParam } from 'neogma';
import { ContactMethod } from '@models';
import { ContactMethodType } from '@learncard/types';

export const updateContactMethod = async (
    id: string,
    updates: Partial<Omit<ContactMethodType, 'id' | 'type' | 'value' | 'createdAt'>>
): Promise<ContactMethodType | null> => {
    const updateData = {
        ...updates,
        ...(updates.isVerified && !updates.verifiedAt ? { verifiedAt: new Date().toISOString() } : {}),
    };

    const result = await new QueryBuilder(
        new BindParam({ id, updates: updateData })
    )
        .match({ model: ContactMethod, identifier: 'contactMethod' })
        .where('contactMethod.id = $id')
        .set('contactMethod += $updates')
        .return('contactMethod')
        .limit(1)
        .run();

    const contactMethod = result.records[0]?.get('contactMethod').properties;

    if (!contactMethod) return null;

    return contactMethod as ContactMethodType;
};

export const verifyContactMethod = async (id: string): Promise<ContactMethodType | null> => {
    return updateContactMethod(id, {
        isVerified: true,
        verifiedAt: new Date().toISOString(),
    });
};

export const setPrimaryContactMethod = async (
    profileDid: string,
    contactMethodId: string
): Promise<boolean> => {
    // First, unset all primary contact methods for this profile
    await new QueryBuilder(new BindParam({ profileDid }))
        .match(
            '(profile:Profile { did: $profileDid })-[:HAS_CONTACT_METHOD]->(contactMethod:ContactMethod)'
        )
        .set('contactMethod.isPrimary = false')
        .run();

    // Then set the specified contact method as primary
    const result = await new QueryBuilder(new BindParam({ profileDid, contactMethodId }))
        .match(
            '(profile:Profile { did: $profileDid })-[:HAS_CONTACT_METHOD]->(contactMethod:ContactMethod { id: $contactMethodId })'
        )
        .set('contactMethod.isPrimary = true')
        .return('contactMethod')
        .limit(1)
        .run();

    return result.records.length > 0;
};