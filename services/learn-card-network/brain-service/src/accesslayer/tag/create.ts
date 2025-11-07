import { neogma } from '@instance';
import { FlatTagType } from 'types/tag';
import { v4 as uuid } from 'uuid';

export type CreateTagInput = Omit<FlatTagType, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

/**
 * Create a Tag node if it does not exist (by slug). If it exists, update the name.
 */
export const createTagIfNotExists = async (input: CreateTagInput): Promise<FlatTagType> => {
    const data: FlatTagType = {
        id: input.id ?? uuid(),
        name: input.name,
        slug: input.slug,
    } as FlatTagType;

    await neogma.queryRunner.run(
        `MERGE (t:Tag { slug: $slug })
         ON CREATE SET t.id = $id, t.name = $name
         ON MATCH SET  t.name = $name`,
        { id: data.id, name: data.name, slug: data.slug }
    );

    const result = await neogma.queryRunner.run(
        `MATCH (t:Tag { slug: $slug }) RETURN t AS t`,
        { slug: data.slug }
    );

    const node = result.records[0]?.get('t') as { properties?: Record<string, any> } | undefined;
    const props = node?.properties ?? {};

    return { id: props.id, name: props.name, slug: props.slug } as FlatTagType;
};
