import { CredentialInstance } from '@models';
import { neogma } from '@instance';

export const deleteCredential = async (credential: CredentialInstance): Promise<void> => {
    await credential.delete({ detach: true });
};

/** Release a failed delivery's reservation only while its credential remains unlinked. */
export const releaseUnlinkedCredential = async (id: string): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (credential:Credential {id: $id})
         WHERE NOT (credential)--()
         OPTIONAL MATCH (:BitstringStatusList)-[:HAS_STATUS_BINDING]->(binding:CredentialStatusBinding {credentialId: $id})
         DETACH DELETE binding, credential`,
        { id }
    );
};
