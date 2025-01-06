import { describe, test, expect } from 'vitest';

import { NetworkLearnCardFromSeed } from '@learncard/init';

import { getLearnCardForUser } from './helpers/learncard.helpers';

let a: NetworkLearnCardFromSeed['returnValue'];
let b: NetworkLearnCardFromSeed['returnValue'];

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

        await a.invoke.clearDidWebCache();

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
});
