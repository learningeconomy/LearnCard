import { beforeAll, afterAll, expect, test } from 'vitest';
import { execa } from 'execa';
import { taggedDescribe } from '../../helpers/tags';
import { verifyCredential } from '@digitalcredentials/verifier-core';
import { getLearnCardForUser } from '../../helpers/learncard.helpers';

taggedDescribe('DCC Interoperability: credential verification', ['@interop', '@dcc'], () => {

    test(
        'verifies a credential from LearnCard',
        async () => {
            const learnCard = await getLearnCardForUser('c');

            const unsignedVc = {
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
                    image:
                        'https://user-images.githubusercontent.com/752326/230469660-8f80d264-eccf-4edd-8e50-ea634d407778.png',
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

            console.log("DID Doc", JSON.stringify(await learnCard.invoke.resolveDid(learnCard.id.did())));

            const verification = await verifyCredential({ credential: signedVc });

            console.log("verification", verification);
            expect(verification.errors).toHaveLength(0);  
        }, 
        60_000 
    );
});
 
