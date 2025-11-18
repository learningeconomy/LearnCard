import { beforeAll, afterAll, expect, test } from 'vitest';
import { execa } from 'execa';
import { taggedDescribe } from '../../helpers/tags';
import { verifyCredential, verifyPresentation } from '@digitalcredentials/verifier-core';
import { getLearnCardForUser } from '../../helpers/learncard.helpers';
import { UnsignedVC } from '@learncard/types';
import { initLearnCard } from '@learncard/init';

taggedDescribe('DCC Interoperability: credential verification', ['@interop', '@dcc'], () => {
    test('verifies a credential from LearnCard', async () => {
        const learnCard = await initLearnCard({
            seed: 'a',
            network: 'https://staging.network.learncard.com/trpc',
        });
        await learnCard.invoke.getProfile();

        const unsignedVc: UnsignedVC = {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            id: 'urn:uuid:2fe53dc9-b2ec-4939-9b2c-0d00f6663b6c',
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            name: 'DCC Test Credential',
            issuer: {
                type: ['Profile'],
                id: learnCard.id.did(),
                name: 'Digital Credentials Consortium Test Issuer',
                url: 'https://dcconsortium.org',
                image: 'https://user-images.githubusercontent.com/752326/230469660-8f80d264-eccf-4edd-8e50-ea634d407778.png',
            },
            validFrom: new Date().toISOString(),
            credentialSubject: {
                type: ['AchievementSubject'],
                achievement: {
                    id: 'urn:uuid:bd6d9316-f7ae-4073-a1e5-2f7f5bd22922',
                    type: ['Achievement'],
                    achievementType: 'Diploma',
                    name: 'Badge',
                    description:
                        'This is a sample credential issued by the Digital Credentials Consortium to demonstrate the functionality of Verifiable Credentials for wallets and verifiers.',
                    criteria: {
                        type: 'Criteria',
                        narrative:
                            'This credential was issued to a student that demonstrated proficiency in the Python programming language.',
                    },
                    image: {
                        id: 'https://user-images.githubusercontent.com/752326/214947713-15826a3a-b5ac-4fba-8d4a-884b60cb7157.png',
                        type: 'Image',
                    },
                },
                name: 'Jane Doe',
            },
        };
        const signedVc = await learnCard.invoke.issueCredential(unsignedVc);
        await learnCard.invoke.verifyCredential(signedVc);

        const registries = [
            {
                'name': 'LEF Member Registry',
                'type': 'dcc-legacy',
                'governanceUrl': 'https://learningeconomy.io',
                'url': 'https://registries.learncard.com/trusted/registry.json',
            },
            {
                'name': 'OpenSALT Test Issuer Registry',
                'type': 'oidf',
                'governanceUrl': 'https://staging.opensalt.net/issuer-registry/governance',
                'trustAnchorEC':
                    'https://staging.opensalt.net/issuer-registry/.well-known/openid-federation',
            },
            {
                'name': 'DCC Sandbox Registry',
                'type': 'dcc-legacy',
                'governanceUrl': 'https://digitalcredentials.github.io/sandbox-registry',
                'url': 'https://digitalcredentials.github.io/sandbox-registry/registry.json',
            },
            {
                'name': 'DCC Community Registry',
                'type': 'dcc-legacy',
                'governanceUrl': 'https://digitalcredentials.github.io/community-registry',
                'url': 'https://digitalcredentials.github.io/community-registry/registry.json',
            },
            {
                'name': 'DCC Member Registry',
                'type': 'dcc-legacy',
                'governanceUrl': 'https://digitalcredentials.github.io/dcc-registry',
                'url': 'https://digitalcredentials.github.io/dcc-registry/registry.json',
            },
            {
                'name': 'MSP Registry',
                'type': 'dcc-legacy',
                'governanceUrl': 'https://pocket.asu.edu/',
                'url': 'https://sandbox-issuer.myskillspocket.com/registry.json',
            },
        ];

        const verification = await verifyCredential({
            credential: signedVc,
            knownDIDRegistries: registries,
        });

        if (verification.errors) {
            expect(verification.errors).toHaveLength(0);
        }
        expect(
            verification.log.some(
                (verification: any) => verification.id === 'registered_issuer' || verification.valid
            )
        ).toBeTruthy();
    }, 60_000);

    test('verifies a presentation from LearnCard', async () => {
        const learnCard = await initLearnCard({
            seed: 'a',
            network: 'https://staging.network.learncard.com/trpc',
        });
        await learnCard.invoke.getProfile();

        const unsignedVc: UnsignedVC = {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            id: 'urn:uuid:2fe53dc9-b2ec-4939-9b2c-0d00f6663b6c',
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            name: 'DCC Test Credential',
            issuer: {
                type: ['Profile'],
                id: learnCard.id.did(),
                name: 'Digital Credentials Consortium Test Issuer',
                url: 'https://dcconsortium.org',
                image: 'https://user-images.githubusercontent.com/752326/230469660-8f80d264-eccf-4edd-8e50-ea634d407778.png',
            },
            validFrom: new Date().toISOString(),
            credentialSubject: {
                type: ['AchievementSubject'],
                achievement: {
                    id: 'urn:uuid:bd6d9316-f7ae-4073-a1e5-2f7f5bd22922',
                    type: ['Achievement'],
                    achievementType: 'Diploma',
                    name: 'Badge',
                    description:
                        'This is a sample credential issued by the Digital Credentials Consortium to demonstrate the functionality of Verifiable Credentials for wallets and verifiers.',
                    criteria: {
                        type: 'Criteria',
                        narrative:
                            'This credential was issued to a student that demonstrated proficiency in the Python programming language.',
                    },
                    image: {
                        id: 'https://user-images.githubusercontent.com/752326/214947713-15826a3a-b5ac-4fba-8d4a-884b60cb7157.png',
                        type: 'Image',
                    },
                },
                name: 'Jane Doe',
            },
        };
        const signedVc = await learnCard.invoke.issueCredential(unsignedVc);
        let vp = await learnCard.invoke.getTestVp();
        vp.verifiableCredential = [signedVc]
        const presentation = await learnCard.invoke.issuePresentation(vp);

        const registries = [
            {
                'name': 'LEF Member Registry',
                'type': 'dcc-legacy',
                'governanceUrl': 'https://learningeconomy.io',
                'url': 'https://registries.learncard.com/trusted/registry.json',
            },
            {
                'name': 'OpenSALT Test Issuer Registry',
                'type': 'oidf',
                'governanceUrl': 'https://staging.opensalt.net/issuer-registry/governance',
                'trustAnchorEC':
                    'https://staging.opensalt.net/issuer-registry/.well-known/openid-federation',
            },
            {
                'name': 'DCC Sandbox Registry',
                'type': 'dcc-legacy',
                'governanceUrl': 'https://digitalcredentials.github.io/sandbox-registry',
                'url': 'https://digitalcredentials.github.io/sandbox-registry/registry.json',
            },
            {
                'name': 'DCC Community Registry',
                'type': 'dcc-legacy',
                'governanceUrl': 'https://digitalcredentials.github.io/community-registry',
                'url': 'https://digitalcredentials.github.io/community-registry/registry.json',
            },
            {
                'name': 'DCC Member Registry',
                'type': 'dcc-legacy',
                'governanceUrl': 'https://digitalcredentials.github.io/dcc-registry',
                'url': 'https://digitalcredentials.github.io/dcc-registry/registry.json',
            },
            {
                'name': 'MSP Registry',
                'type': 'dcc-legacy',
                'governanceUrl': 'https://pocket.asu.edu/',
                'url': 'https://sandbox-issuer.myskillspocket.com/registry.json',
            },
        ];

        const verification = await verifyPresentation({
            presentation: presentation,
            knownDIDRegistries: registries,
        });

        if (verification.errors) {
            expect(verification.errors).toHaveLength(0);
        }
        expect(verification.presentationResult?.signature).toBe("valid")
        const credentialInPresentationVerification = verification?.credentialResults?.[0]
        if (!credentialInPresentationVerification) {
            throw new Error('No credential in presentation verification');
        }
        if (!credentialInPresentationVerification.log) {
            throw new Error('No log in credential in presentation verification');
        }

        expect(
            credentialInPresentationVerification.log.some(
                (verification: any) => verification.id === 'registered_issuer' || verification.valid
            )
        ).toBeTruthy();
    }, 60_000);
});
