import { describe, test, expect } from 'vitest';

import { getLearnCardForUser, LearnCard } from './helpers/learncard.helpers';

let a: LearnCard;
let b: LearnCard;

describe('Dids', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
    });

    test('Users can add extra metadata', async () => {
        const aDidDoc = await a.invoke.resolveDid(a.id.did());
        const extraMetadata = {
            'verificationMethod': [
                {
                    'id': 'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw#z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
                    'type': 'Ed25519VerificationKey2018',
                    'controller':
                        'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw#z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
                    'publicKeyJwk': {
                        'kty': 'OKP',
                        'crv': 'Ed25519',
                        'x': '2GT60bKXUXlstbfT3UUHfZLwYHUEjaGI0l5qwNxWk7o',
                    },
                },
            ],
            'keyAgreement': [
                {
                    'id': a.id.did() + '#z6LSmBnb8nGVLxHrX3df63f1J9UH4xWJrajRakDcaMeUFpiK',
                    'type': 'X25519KeyAgreementKey2019',
                    'controller':
                        'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw#z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
                    'publicKeyBase58': 'AWcRcUTdFVa7RfFtZQ93yZFoDoyC9yZGhmVw5tzwYSwZ',
                },
            ],
        };

        await a.invoke.addDidMetadata(extraMetadata);

        const newDidDoc = await a.invoke.resolveDid(a.id.did());

        expect(newDidDoc).not.toEqual(aDidDoc);
        expect(
            newDidDoc.keyAgreement?.some(keyAgreement => {
                return (
                    (keyAgreement as any).controller ===
                    'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw#z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw'
                );
            })
        ).toBeTruthy();
    });

    test('Users can CRUD extra metadata', async () => {
        const aDidDoc = await a.invoke.resolveDid(a.id.did());
        const extraMetadata = {
            'verificationMethod': [
                {
                    'id': 'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw#z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
                    'type': 'Ed25519VerificationKey2018',
                    'controller':
                        'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw#z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
                    'publicKeyJwk': {
                        'kty': 'OKP',
                        'crv': 'Ed25519',
                        'x': '2GT60bKXUXlstbfT3UUHfZLwYHUEjaGI0l5qwNxWk7o',
                    },
                },
            ],
            'keyAgreement': [
                {
                    'id': a.id.did() + '#z6LSmBnb8nGVLxHrX3df63f1J9UH4xWJrajRakDcaMeUFpiK',
                    'type': 'X25519KeyAgreementKey2019',
                    'controller':
                        'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw#z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw',
                    'publicKeyBase58': 'AWcRcUTdFVa7RfFtZQ93yZFoDoyC9yZGhmVw5tzwYSwZ',
                },
            ],
        };

        await a.invoke.addDidMetadata(extraMetadata);

        const newDidDoc = await a.invoke.resolveDid(a.id.did());

        expect(newDidDoc).not.toEqual(aDidDoc);
        expect(
            newDidDoc.keyAgreement?.some(keyAgreement => {
                return (
                    (keyAgreement as any).controller ===
                    'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw#z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw'
                );
            })
        ).toBeTruthy();

        const metadata = await a.invoke.getMyDidMetadata();

        expect(metadata).toHaveLength(1);

        const metadataId = metadata[0].id;

        expect(metadataId).toBeTruthy();

        const resolvedMetadata = await a.invoke.getDidMetadata(metadataId);

        expect(resolvedMetadata).not.toBeUndefined();
        expect(metadata[0]).toMatchObject(resolvedMetadata!);

        await a.invoke.updateDidMetadata(metadataId, {
            verificationMethod: [],
            keyAgreement: [],
        });

        const newResolvedMetadata = await a.invoke.getDidMetadata(metadataId);

        expect(newResolvedMetadata).not.toBeUndefined();
        expect(newResolvedMetadata).not.toMatchObject(resolvedMetadata!);
        expect(newResolvedMetadata).toMatchObject({ verificationMethod: [], keyAgreement: [] });

        const newNewDidDoc = await a.invoke.resolveDid(a.id.did());

        expect(newNewDidDoc).not.toEqual(newDidDoc);
        expect(
            newNewDidDoc.keyAgreement?.some(keyAgreement => {
                return (
                    (keyAgreement as any).controller ===
                    'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw#z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw'
                );
            })
        ).toBeFalsy();
        expect(newNewDidDoc).toMatchObject(aDidDoc);

        await a.invoke.deleteDidMetadata(metadataId);

        const newNewResolvedMetadata = await a.invoke.getDidMetadata(metadataId);

        expect(newNewResolvedMetadata).toBeUndefined();

        const newNewNewDidDoc = await a.invoke.resolveDid(a.id.did());

        expect(newNewNewDidDoc).toMatchObject(newNewDidDoc);
        expect(
            newNewNewDidDoc.keyAgreement?.some(keyAgreement => {
                return (
                    (keyAgreement as any).controller ===
                    'did:key:z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw#z6Mku1yR3226QyTfM7HBJeAc986TcnUms6CUSsYuoPb48Uyw'
                );
            })
        ).toBeFalsy();
        expect(newNewNewDidDoc).toMatchObject(aDidDoc);
    });
});
