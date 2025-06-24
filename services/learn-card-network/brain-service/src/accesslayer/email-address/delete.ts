import { QueryBuilder, BindParam } from 'neogma';
import { EmailAddress } from '@models';

export const deleteEmailAddress = async (id: string): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ id }))
        .match({ model: EmailAddress, identifier: 'emailAddress', where: { id: '$id' } })
        .delete('emailAddress')
        .run();

    return result.summary.counters.updates().nodesDeleted > 0;
};

export const deleteEmailAddressByEmail = async (email: string): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ email }))
        .match({ model: EmailAddress, identifier: 'emailAddress', where: { email: '$email' } })
        .delete('emailAddress')
        .run();

    return result.summary.counters.updates().nodesDeleted > 0;
};