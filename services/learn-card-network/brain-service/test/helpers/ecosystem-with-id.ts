/**
 * Pinned-id ecosystem fixture, kept apart from education-os.helpers so the scenario
 * runner can import it without pulling in manifest.helpers.
 */
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { getEcosystemById } from '@accesslayer/ecosystem/read';
import { neogma } from '@instance';

/**
 * Ecosystems are normally created with a generated `eco_<uuid>` id, but dev
 * tooling pins a well-known id (console-bff `dev/policies.json` rootEcosystemId).
 * Creating one via `createEcosystem` and re-pointing its id keeps every derived
 * field (pathIds/slugPath/depth/rootEcosystemId) correct, which a bare
 * `MERGE (e:Ecosystem {id})` does not.
 */
export const ensureEcosystemWithId = async (input: {
    ecosystemId: string;
    slug: string;
    name: string;
    ownerProfileId: string;
}): Promise<string> => {
    const existing = await getEcosystemById(input.ecosystemId);

    if (existing) {
        await neogma.queryRunner.run(
            `MATCH (e:Ecosystem { id: $ecosystemId })
             SET e.name = coalesce(e.name, $name),
                 e.slug = coalesce(e.slug, $slug),
                 e.status = coalesce(e.status, 'ACTIVE'),
                 e.ownerProfileId = coalesce(e.ownerProfileId, $ownerProfileId),
                 e.settings = coalesce(e.settings, '{}'),
                 e.pathIds = coalesce(e.pathIds, [$ecosystemId]),
                 e.slugPath = coalesce(e.slugPath, [$slug]),
                 e.depth = coalesce(e.depth, 0),
                 e.rootEcosystemId = coalesce(e.rootEcosystemId, $ecosystemId),
                 e.createdAt = coalesce(e.createdAt, $now),
                 e.updatedAt = $now`,
            { ...input, now: new Date().toISOString() }
        );

        return input.ecosystemId;
    }

    const created = await createEcosystem({
        name: input.name,
        slug: input.slug,
        description: undefined,
        parentEcosystemId: null,
        ownerProfileId: input.ownerProfileId,
        settings: {},
        status: 'ACTIVE',
    } as Parameters<typeof createEcosystem>[0]);

    await neogma.queryRunner.run(
        `MATCH (e:Ecosystem { id: $generatedId })
         SET e.id = $ecosystemId, e.pathIds = [$ecosystemId], e.rootEcosystemId = $ecosystemId`,
        { generatedId: created.id, ecosystemId: input.ecosystemId }
    );

    return input.ecosystemId;
};
