import { neogma } from '@instance';
import { FlatTagType } from 'types/tag';

export const getTagBySlug = async (slug: string): Promise<FlatTagType | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (t:Tag { slug: $slug }) RETURN t AS t`,
        { slug }
    );

    const node = result.records[0]?.get('t') as { properties?: Record<string, any> } | undefined;
    return (node?.properties as FlatTagType) ?? null;
};

export const getTagById = async (id: string): Promise<FlatTagType | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (t:Tag { id: $id }) RETURN t AS t`,
        { id }
    );

    const node = result.records[0]?.get('t') as { properties?: Record<string, any> } | undefined;
    return (node?.properties as FlatTagType) ?? null;
};

export const listAllTags = async (): Promise<FlatTagType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (t:Tag) RETURN t AS t`
    );

    return result.records
        .map(r => (r.get('t') as any)?.properties as FlatTagType)
        .filter(Boolean);
};
