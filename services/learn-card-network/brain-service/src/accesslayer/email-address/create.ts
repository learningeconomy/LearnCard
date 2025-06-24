import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';

import { EmailAddress } from '@models';
import { EmailAddressType } from 'types/email-address';

export const createEmailAddress = async (input: {
    email: string;
    isVerified?: boolean;
    isPrimary?: boolean;
}): Promise<EmailAddressType> => {
    const emailAddressData = {
        id: uuid(),
        email: input.email,
        isVerified: input.isVerified ?? false,
        isPrimary: input.isPrimary ?? false,
        createdAt: new Date().toISOString(),
        ...(input.isVerified ? { verifiedAt: new Date().toISOString() } : {}),
    };

    const result = await new QueryBuilder(
        new BindParam({ params: emailAddressData })
    )
        .create({ model: EmailAddress, identifier: 'emailAddress' })
        .set('emailAddress += $params')
        .return('emailAddress')
        .limit(1)
        .run();

    const emailAddress = result.records[0]?.get('emailAddress').properties!;

    return emailAddress as EmailAddressType;
};