import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';

import { ContactMethod } from '@models';
import { ContactMethodType } from '@learncard/types';

export const createContactMethod = async (input: {
    type: 'email' | 'phone';
    value: string;
    isVerified?: boolean;
    isPrimary?: boolean;
}): Promise<ContactMethodType> => {
    const contactMethodData = {
        id: uuid(),
        type: input.type,
        value: input.value,
        isVerified: input.isVerified ?? false,
        isPrimary: input.isPrimary ?? false,
        createdAt: new Date().toISOString(),
    };

    const result = await new QueryBuilder(new BindParam({ params: contactMethodData }))
        .create({ model: ContactMethod, identifier: 'contactMethod' })
        .set('contactMethod += $params')
        .return('contactMethod')
        .limit(1)
        .run();

    const contactMethod = result.records[0]?.get('contactMethod').properties!;

    return contactMethod as ContactMethodType;
};