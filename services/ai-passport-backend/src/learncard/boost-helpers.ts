import type { BoostPermissions, UnsignedVC, VC } from '@learncard/types';
import { randomUUID } from 'node:crypto';
import { VCValidator } from '@learncard/types';
import { getLearnCard } from './index';
import { contractUri } from './constants';
import { assertOwnerOperationActive, withOwnerOperation } from '../services/dataErasure';
import { createExternalArtifact } from './external-artifacts';

type BoostOptions = {
    status: 'LIVE' | 'DRAFT' | undefined;
    category: string;
};

// Explicitly override LCN's public canView default. Creator/admin permissions
// and recipient access are separate relationships, not default permissions.
const privatePermissions: BoostPermissions = {
    role: 'empty',
    canView: false,
    canEdit: false,
    canIssue: false,
    canRevoke: false,
    canManagePermissions: false,
    canIssueChildren: '',
    canCreateChildren: '',
    canEditChildren: '',
    canRevokeChildren: '',
    canManageChildrenPermissions: '',
    canManageChildrenProfiles: false,
    canViewAnalytics: false,
};

/**
 * Creates, signs, and publishes a boost credential to the LearnCard network.
 *
 * Workflow:
 * 1. Get LearnCard instance
 * 2. Create boost (parent or child based on parentBoostUri)
 * 3. Assign boostId to credential
 * 4. Sign credential with issueCredential
 * 5. Write to contract storage
 *
 * @param unsignedVc - Unsigned credential to publish (will be mutated with boostId)
 * @param did - Subject DID
 * @param boostOptions - Boost category and status; privacy cannot be overridden
 * @param parentBoostUri - Optional parent boost URI (creates child if provided)
 * @returns Object containing boostUri, signedVc, and contractCredentialUri
 */
export async function createAndPublishBoostCredential({
    unsignedVc,
    did,
    boostOptions,
    parentBoostUri,
    beforeRemoteOperation,
}: {
    unsignedVc: UnsignedVC;
    did: string;
    boostOptions: BoostOptions;
    parentBoostUri?: string;
    beforeRemoteOperation?: () => void;
}): Promise<{
    boostUri: string;
    signedVc: VC;
    contractCredentialUri: string;
}> {
    return withOwnerOperation(did, async () => {
        const learnCard = await getLearnCard();
        // Each publication needs its own correlation ID, including ambiguous remote failures.
        unsignedVc.id = `urn:uuid:${randomUUID()}`;
        const credentialId = unsignedVc.id;
        // LCN currently stores the template before attaching its default role.
        // Never send learner data even during that public creation window. The
        // actual signed credential below retains the complete original payload.
        const template: UnsignedVC = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: learnCard.id.did(),
            issuanceDate: new Date().toISOString(),
            credentialSubject: {},
        };
        const metadata = {
            status: boostOptions.status,
            category: boostOptions.category,
            name: 'AI Passport credential',
            allowAnyoneToCreateChildren: false,
            defaultPermissions: { ...privatePermissions },
            claimPermissions: { ...privatePermissions },
        };
        beforeRemoteOperation?.();
        const boostUri = await createExternalArtifact(
            did,
            parentBoostUri ? 'child-boost' : 'boost',
            credentialId,
            () =>
                parentBoostUri
                    ? learnCard.invoke.createChildBoost(parentBoostUri, template, metadata)
                    : learnCard.invoke.createBoost(template, metadata)
        );
        unsignedVc.boostId = boostUri;
        await assertOwnerOperationActive(did);
        // The plugin aggregate loses the concrete issuance input type.
        const issuanceInput = unsignedVc as unknown as Parameters<
            typeof learnCard.invoke.issueCredential
        >[0];
        const issuedCredential = await learnCard.invoke.issueCredential(issuanceInput);
        const signedVc = VCValidator.parse(issuedCredential);
        // Contract writes do not encrypt automatically, unlike SDK sendBoost.
        // A public credential URI must resolve only to ciphertext. Both the holder
        // and this service can decrypt; sender ownership still authorizes deletion.
        const encryptedVc = await learnCard.invoke.createDagJwe(signedVc, [
            did,
            learnCard.id.did(),
        ]);
        beforeRemoteOperation?.();
        const contractCredentialUri = await createExternalArtifact(
            did,
            'contract-credential',
            credentialId,
            () =>
                learnCard.invoke.writeCredentialToContract(did, contractUri, encryptedVc, boostUri)
        );
        return { boostUri, signedVc, contractCredentialUri };
    });
}
