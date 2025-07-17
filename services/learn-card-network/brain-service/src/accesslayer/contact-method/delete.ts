import { QueryBuilder, BindParam } from 'neogma';
import { ContactMethod } from '@models';

export const deleteContactMethod = async (id: string): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ id }))
        .match({ model: ContactMethod, identifier: 'contactMethod' })
        .where('contactMethod.id = $id')
        .delete('contactMethod')
        .run();

    return result.summary.counters.updates().nodesDeleted > 0;
};

export const deleteContactMethodByValue = async (
    type: 'email' | 'phone',
    value: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ type, value }))
        .match({ model: ContactMethod, identifier: 'contactMethod' })
        .where('contactMethod.type = $type AND contactMethod.value = $value')
        .delete('contactMethod')
        .run();

    return result.summary.counters.updates().nodesDeleted > 0;
};