import { CredentialInstance } from '@models';
import { neogma } from '@instance';

export const deleteCredential = async (credential: CredentialInstance): Promise<void> => {
    await credential.delete({ detach: true });
};

/** Release failed deliveries with no relationships beyond Boost instance membership. */
export const releaseUnlinkedCredential = async (id: string): Promise<void> => {
    await neogma.getTransaction(null, async tx => {
        const eligible = await tx.run(
            `MATCH (credential:Credential {id: $id})
             SET credential._statusMutationLock = true REMOVE credential._statusMutationLock
             WITH credential
             WHERE NOT EXISTS {
                 MATCH (credential)-[relationship]-()
                 WHERE type(relationship) <> 'INSTANCE_OF'
             }
             RETURN credential.id AS id`,
            { id }
        );
        if (eligible.records.length === 0) return;
        const lists = await tx.run(
            `MATCH (list:BitstringStatusList)-[:HAS_STATUS_BINDING]->(binding:CredentialStatusBinding)
             WHERE $id IN coalesce(binding.credentialIds, [binding.credentialId])
             RETURN DISTINCT list.statusListCredential AS url ORDER BY url`,
            { id }
        );
        // Match reservation lock order and re-read membership only after acquiring each list lock.
        for (const row of [...lists.records].sort((a, b) =>
            String(a.get('url')).localeCompare(String(b.get('url')))
        )) {
            const url = String(row.get('url'));
            await tx.run(
                `MATCH (list:BitstringStatusList {statusListCredential: $url})
             SET list._statusBindingLock = true REMOVE list._statusBindingLock`,
                { url }
            );
            await tx.run(
                `MATCH (:BitstringStatusList {statusListCredential: $url})-[:HAS_STATUS_BINDING]->(binding:CredentialStatusBinding)
             WHERE binding.refreshId IS NULL AND $id IN coalesce(binding.credentialIds, [binding.credentialId])
             WITH binding, [member IN coalesce(binding.credentialIds, [binding.credentialId]) WHERE member <> $id] AS remaining
             SET binding.credentialIds = remaining, binding.credentialId = head(remaining)
             FOREACH (_ IN CASE WHEN size(remaining) = 0 THEN [1] ELSE [] END | DETACH DELETE binding)`,
                { id, url }
            );
        }
        await tx.run('MATCH (credential:Credential {id: $id}) DETACH DELETE credential', { id });
    });
};
