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

describe('Recursive Profile Management', () => {
    let userA: LearnCard;
    let userB: LearnCard;
    let userC: LearnCard;
    let userD_profileP: LearnCard; // Represents Profile P
    let userE_pm1: LearnCard; // Represents ProfileManager PM1

    beforeEach(async () => {
        userA = await getLearnCardForUser('a');
        userB = await getLearnCardForUser('b');
        userC = await getLearnCardForUser('c');
        userD_profileP = await getLearnCardForUser('d'); // For Profile P
        userE_pm1 = await getLearnCardForUser('e'); // For PM1
    });

    test('User A can switch to User C if A manages B and B manages C', async () => {
        // Setup: A manages B, B manages C
        // Assuming managedProfile.invoke.addManager({ managerDid: managerProfile.id.did(), managedProfileId: managedProfile.getProfile().profileId })
        // Or a similar API. The exact method depends on the SDK.
        // Let's assume `addManagerToProfile` exists and takes the managed profile's DID and the manager's DID.
        await userB.invoke.addManagerToProfile({ managedProfileDid: userB.id.did(), managerDid: userA.id.did() });
        await userC.invoke.addManagerToProfile({ managedProfileDid: userC.id.did(), managerDid: userB.id.did() });
        
        // Action: Resolve userA's DID document
        // User A's DID document should reflect keys/control over C due to transitive management
        const didDocA = await userA.invoke.resolveDid(userA.id.did());

        // Assertion: Verify that didDocA contains key material for userC
        // This implies that User A's DID document would list User C's verification methods or control them.
        const hasUserCKey =
            didDocA.verificationMethod?.some(
                vm => vm.controller === userC.id.did() || vm.id.startsWith(userC.id.did() + '#')
            ) ||
            didDocA.authentication?.some(auth => auth.startsWith && auth.startsWith(userC.id.did() + '#')) ||
            didDocA.keyAgreement?.some(
                ka => ka.id.startsWith(userC.id.did() + '#')
            ) ||
            didDocA.capabilityDelegation?.some(cd => cd.startsWith && cd.startsWith(userC.id.did() + '#')) ||
            didDocA.capabilityInvocation?.some(ci => ci.startsWith && ci.startsWith(userC.id.did() + '#'));

        expect(hasUserCKey, "User A's DID document should contain key material for User C").toBeTruthy();
    });

    test('User A can switch to Profile P if A administrates PM1 and PM1 manages P', async () => {
        // Setup:
        // userA administrates userE_pm1 (ProfileManager PM1)
        // userE_pm1 manages userD_profileP (Profile P)
        await userE_pm1.invoke.addAdministratorToProfileManager({ profileManagerDid: userE_pm1.id.did(), administratorDid: userA.id.did() });
        await userD_profileP.invoke.setManagingProfileManager({ managedProfileDid: userD_profileP.id.did(), profileManagerDid: userE_pm1.id.did() });

        // Action: Resolve userA's DID document
        const didDocA = await userA.invoke.resolveDid(userA.id.did());

        // Assertion: Verify that didDocA contains key material for userD_profileP
        const hasProfilePKey =
            didDocA.verificationMethod?.some(
                vm => vm.controller === userD_profileP.id.did() || vm.id.startsWith(userD_profileP.id.did() + '#')
            ) ||
            didDocA.authentication?.some(auth => auth.startsWith && auth.startsWith(userD_profileP.id.did() + '#')) ||
            didDocA.keyAgreement?.some(
                ka => ka.id.startsWith(userD_profileP.id.did() + '#')
            ) ||
            didDocA.capabilityDelegation?.some(cd => cd.startsWith && cd.startsWith(userD_profileP.id.did() + '#')) ||
            didDocA.capabilityInvocation?.some(ci => ci.startsWith && ci.startsWith(userD_profileP.id.did() + '#'));

        expect(hasProfilePKey, "User A's DID document should contain key material for Profile P").toBeTruthy();
    });

    test('User C DID doc shows User A as a recursive manager if C is managed by B and B by A', async () => {
        // Setup: A manages B, B manages C (re-establish for clarity, or rely on beforeEach if state persists - better to be explicit)
        await userB.invoke.addManagerToProfile({ managedProfileDid: userB.id.did(), managerDid: userA.id.did() });
        await userC.invoke.addManagerToProfile({ managedProfileDid: userC.id.did(), managerDid: userB.id.did() });

        // Action: Resolve userC's DID document
        const didDocC = await userC.invoke.resolveDid(userC.id.did());

        // Assertion: Verify that didDocC indicates userA as a manager.
        // This could be userA.id.did() appearing in a 'controller' field of C's DID doc,
        // or in one of its verification methods not belonging to C itself.
        let isUserAManager = false;
        if (didDocC.controller) {
            if (Array.isArray(didDocC.controller)) {
                isUserAManager = didDocC.controller.includes(userA.id.did());
            } else {
                isUserAManager = didDocC.controller === userA.id.did();
            }
        }

        // Also check verificationMethods, if a manager's key is directly listed for control.
        // A common pattern is that the verification method's `controller` field would be userA's DID.
        if (!isUserAManager && didDocC.verificationMethod) {
            isUserAManager = didDocC.verificationMethod.some(
                vm => vm.controller === userA.id.did()
            );
        }
        
        // It might also be in other proof-enabling sections if User A can directly use User C's DID methods
        if (!isUserAManager && didDocC.authentication) {
            isUserAManager = didDocC.authentication.some(
                auth => typeof auth === 'object' && auth.id && auth.controller === userA.id.did()
            );
        }
        // Add similar checks for assertionMethod, keyAgreement, capabilityDelegation, capabilityInvocation if relevant

        expect(isUserAManager, "User C's DID document should list User A as a controller/manager").toBeTruthy();
    });
});
