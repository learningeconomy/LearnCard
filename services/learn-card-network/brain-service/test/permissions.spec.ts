import { BoostPermissions } from '@learncard/types';
import { getUser } from './helpers/getClient';
import { adminRole, emptyRole } from './helpers/permissions';
import { testUnsignedBoost, testVc } from './helpers/send';
import { Profile, Boost, Credential, SigningAuthority } from '@models';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;

describe('Permissions', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
    });

    describe('canEdit', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should allow you to override the canEdit permission', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canEdit).toBeTruthy();

            expect(
                await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canEdit: false },
                })
            ).toBeTruthy();

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canEdit).toBeFalsy();
        });

        it('allows users with this permission to edit a boost', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: 'DRAFT',
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canEdit).toBeTruthy();

            await expect(
                userB.clients.fullAuth.boost.updateBoost({ uri, updates: { type: 'test' } })
            ).resolves.not.toThrow();

            const boost = await userA.clients.fullAuth.boost.getBoost({ uri });

            expect(boost.type).toEqual('test');
        });

        it('does not allow users without this permission to edit a boost', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: 'DRAFT',
                type: 'untouched',
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri,
                profileId: 'userb',
                updates: { canEdit: false },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canEdit).toBeFalsy();

            await expect(
                userB.clients.fullAuth.boost.updateBoost({ uri, updates: { type: 'test' } })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            const boost = await userA.clients.fullAuth.boost.getBoost({ uri });

            expect(boost.type).toEqual('untouched');
        });
    });

    describe('canIssue', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should allow you to override the canIssue permission', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canIssue).toBeTruthy();

            expect(
                await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canIssue: false },
                })
            ).toBeTruthy();

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canIssue).toBeFalsy();
        });

        it('allows users with this permission to issue a boost', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: uri,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canIssue).toBeTruthy();

            await expect(
                userB.clients.fullAuth.boost.sendBoost({ profileId: 'usera', uri, credential })
            ).resolves.not.toThrow();

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({
                    from: 'userb',
                })
            ).toHaveLength(1);
        });

        it('does not allow users without this permission to issue a boost', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: uri,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri,
                profileId: 'userb',
                updates: { canIssue: false },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canIssue).toBeFalsy();

            await expect(
                userB.clients.fullAuth.boost.sendBoost({ profileId: 'usera', uri, credential })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({
                    from: 'userb',
                })
            ).toHaveLength(0);
        });
    });

    describe('canRevoke (revocation is not implemented yet!)', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should allow you to override the canRevoke permission', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canRevoke).toBeTruthy();

            expect(
                await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canRevoke: false },
                })
            ).toBeTruthy();

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canRevoke).toBeFalsy();
        });
    });

    describe('canManagePermissions', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should allow you to override the canManagePermissions permission', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canManagePermissions).toBeTruthy();

            expect(
                await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canManagePermissions: false },
                })
            ).toBeTruthy();

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canManagePermissions).toBeFalsy();
        });

        it('allows users with this permission to manage permissions for a boost', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });
            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canManagePermissions).toBeTruthy();
            expect(permissions.canEdit).toBeTruthy();

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri,
                    updates: { canEdit: false },
                })
            ).resolves.not.toThrow();

            const newPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({ uri });

            expect(newPermissions.canEdit).toBeFalsy();

            const otherPermissions = await userC.clients.fullAuth.boost.getBoostPermissions({
                uri,
            });

            expect(otherPermissions.canIssue).toBeTruthy();

            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    profileId: 'userc',
                    uri,
                    updates: { canIssue: false },
                })
            ).resolves.not.toThrow();

            const newOtherPermissions = await userC.clients.fullAuth.boost.getBoostPermissions({
                uri,
            });

            expect(newOtherPermissions.canIssue).toBeFalsy();
        });

        it('does not allow users without this permission to manage permissions for a boost', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });
            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                profileId: 'userb',
                uri,
                updates: { canManagePermissions: false },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canManagePermissions).toBeFalsy();
            expect(permissions.canEdit).toBeTruthy();

            const otherPermissions = await userC.clients.fullAuth.boost.getBoostPermissions({
                uri,
            });

            expect(otherPermissions.canIssue).toBeTruthy();

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri,
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    profileId: 'userc',
                    uri,
                    updates: { canIssue: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            const newPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({ uri });

            expect(newPermissions.canEdit).toBeTruthy();

            const newOtherPermissions = await userC.clients.fullAuth.boost.getBoostPermissions({
                uri,
            });

            expect(newOtherPermissions.canIssue).toBeTruthy();
        });

        (['canEdit', 'canIssue', 'canRevoke'] as const).forEach(permission => {
            describe(permission, () => {
                it(`can manage ${permission} when it is true for the owner`, async () => {
                    const uri = await userA.clients.fullAuth.boost.createBoost({
                        credential: testUnsignedBoost,
                    });

                    await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });
                    await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri });

                    const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                        { profileId: 'userb', uri }
                    );

                    expect(permissions.canManagePermissions).toBeTruthy();
                    expect(permissions[permission]).toBeTruthy();

                    const otherPermissions = await userC.clients.fullAuth.boost.getBoostPermissions(
                        { uri }
                    );

                    expect(otherPermissions[permission]).toBeTruthy();

                    await expect(
                        userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                            profileId: 'userc',
                            uri,
                            updates: { [permission]: false },
                        })
                    ).resolves.not.toThrow();

                    await expect(
                        userB.clients.fullAuth.boost.updateBoostPermissions({
                            uri,
                            updates: { [permission]: false },
                        })
                    ).resolves.not.toThrow();

                    const newPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({
                        uri,
                    });

                    expect(newPermissions[permission]).toBeFalsy();

                    const newOtherPermissions =
                        await userC.clients.fullAuth.boost.getBoostPermissions({
                            uri,
                        });

                    expect(newOtherPermissions[permission]).toBeFalsy();
                });

                it(`can't manage ${permission} when it is false for the owner`, async () => {
                    const uri = await userA.clients.fullAuth.boost.createBoost({
                        credential: testUnsignedBoost,
                    });

                    await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });
                    await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri });

                    await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                        profileId: 'userb',
                        uri,
                        updates: { [permission]: false },
                    });

                    const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                        { profileId: 'userb', uri }
                    );

                    expect(permissions.canManagePermissions).toBeTruthy();
                    expect(permissions[permission]).toBeFalsy();

                    const otherPermissions = await userC.clients.fullAuth.boost.getBoostPermissions(
                        { uri }
                    );

                    expect(otherPermissions[permission]).toBeTruthy();

                    await expect(
                        userB.clients.fullAuth.boost.updateBoostPermissions({
                            uri,
                            updates: { [permission]: true },
                        })
                    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
                    await expect(
                        userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                            profileId: 'userc',
                            uri,
                            updates: { [permission]: false },
                        })
                    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

                    const newPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({
                        uri,
                    });

                    expect(newPermissions[permission]).toBeFalsy();

                    const newOtherPermissions =
                        await userC.clients.fullAuth.boost.getBoostPermissions({
                            uri,
                        });

                    expect(newOtherPermissions[permission]).toBeTruthy();
                });
            });
        });
    });

    describe('canIssueChildren', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should allow you to override the canIssueChildren permission', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canIssueChildren).toEqual('*');

            expect(
                await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canIssueChildren: '' },
                })
            ).toBeTruthy();

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canIssueChildren).toEqual('');
        });

        it('should work with multiple parents', async () => {
            const parent1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: parent1Uri,
                boost: { credential: testUnsignedBoost },
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: childUri,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ childUri, parentUri: parent2Uri });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parent1Uri,
            });
            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parent2Uri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent1Uri,
                profileId: 'userb',
                updates: { canIssueChildren: '' },
            });

            const parent1Permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parent1Uri,
            });

            expect(parent1Permissions.canIssueChildren).toEqual('');

            const parent2Permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parent2Uri,
            });

            expect(parent2Permissions.canIssueChildren).toEqual('*');

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({ from: 'userb' })
            ).toHaveLength(0);

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    uri: childUri,
                    profileId: 'usera',
                    credential,
                })
            ).resolves.not.toThrow();

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({ from: 'userb' })
            ).toHaveLength(1);

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent1Uri,
                profileId: 'userb',
                updates: { canIssueChildren: '*' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent2Uri,
                profileId: 'userb',
                updates: { canIssueChildren: '' },
            });

            const parent1Permissions2 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent1Uri,
                }
            );

            expect(parent1Permissions2.canIssueChildren).toEqual('*');

            const parent2Permissions2 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent2Uri,
                }
            );

            expect(parent2Permissions2.canIssueChildren).toEqual('');

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    uri: childUri,
                    profileId: 'usera',
                    credential,
                })
            ).resolves.not.toThrow();

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({ from: 'userb' })
            ).toHaveLength(2);

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent2Uri,
                profileId: 'userb',
                updates: { canIssueChildren: '*' },
            });

            const parent1Permissions3 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent1Uri,
                }
            );

            expect(parent1Permissions3.canIssueChildren).toEqual('*');

            const parent2Permissions3 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent2Uri,
                }
            );

            expect(parent2Permissions3.canIssueChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    uri: childUri,
                    profileId: 'usera',
                    credential,
                })
            ).resolves.not.toThrow();

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({ from: 'userb' })
            ).toHaveLength(3);

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent1Uri,
                profileId: 'userb',
                updates: { canIssueChildren: '' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent2Uri,
                profileId: 'userb',
                updates: { canIssueChildren: '' },
            });

            const parent1Permissions4 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent1Uri,
                }
            );

            expect(parent1Permissions4.canIssueChildren).toEqual('');

            const parent2Permissions4 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent2Uri,
                }
            );

            expect(parent2Permissions4.canIssueChildren).toEqual('');

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    uri: childUri,
                    profileId: 'usera',
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({ from: 'userb' })
            ).toHaveLength(3);
        });

        it('should apply to grandchildren', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: {
                    credential: testVc,
                },
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testUnsignedBoost },
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: childUri,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: grandParentUri,
            });
            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: grandParentUri,
                profileId: 'userb',
                updates: { canIssueChildren: '' },
            });

            const grandparentPermissions =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandParentUri,
                });

            expect(grandparentPermissions.canIssueChildren).toEqual('');

            const parentPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(parentPermissions.canIssueChildren).toEqual('*');

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({ from: 'userb' })
            ).toHaveLength(0);

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    uri: childUri,
                    profileId: 'usera',
                    credential,
                })
            ).resolves.not.toThrow();

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({ from: 'userb' })
            ).toHaveLength(1);

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: grandParentUri,
                profileId: 'userb',
                updates: { canIssueChildren: '*' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canIssueChildren: '' },
            });

            const grandParentPermissions2 =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandParentUri,
                });

            expect(grandParentPermissions2.canIssueChildren).toEqual('*');

            const parentPermissions2 = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(parentPermissions2.canIssueChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    uri: childUri,
                    profileId: 'usera',
                    credential,
                })
            ).resolves.not.toThrow();

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({ from: 'userb' })
            ).toHaveLength(2);

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: grandParentUri,
                profileId: 'userb',
                updates: { canIssueChildren: '' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canIssueChildren: '*' },
            });

            const grandParentPermissions3 =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandParentUri,
                });

            expect(grandParentPermissions3.canIssueChildren).toEqual('');

            const parentPermissions3 = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(parentPermissions3.canIssueChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    uri: childUri,
                    profileId: 'usera',
                    credential,
                })
            ).resolves.not.toThrow();

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({ from: 'userb' })
            ).toHaveLength(3);

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: grandParentUri,
                profileId: 'userb',
                updates: { canIssueChildren: '' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canIssueChildren: '' },
            });

            const grandParentPermissions4 =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandParentUri,
                });

            expect(grandParentPermissions4.canIssueChildren).toEqual('');

            const parentPermissions4 = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(parentPermissions4.canIssueChildren).toEqual('');

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    uri: childUri,
                    profileId: 'usera',
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({ from: 'userb' })
            ).toHaveLength(3);
        });

        it('should not allow you to set invalid JSON', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canIssueChildren).toEqual('*');

            await expect(
                userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canIssueChildren: 'not valid json!!!}' },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canIssueChildren).toEqual('*');
        });

        it('should allow you to issue any children via *', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credential1 = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: child1Uri,
            });
            const credential2 = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: child2Uri,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri: child1Uri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri: child2Uri });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canIssueChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'usera',
                    uri: child1Uri,
                    credential: credential1,
                })
            ).resolves.not.toThrow();

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({ from: 'userb' })
            ).toHaveLength(1);

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'usera',
                    uri: child2Uri,
                    credential: credential2,
                })
            ).resolves.not.toThrow();

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({ from: 'userb' })
            ).toHaveLength(2);
        });

        it('should allow you to issue only some children via a query', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Social Badge',
            });
            const child2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
            });

            const credential1 = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: child1Uri,
            });
            const credential2 = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: child2Uri,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri: child1Uri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri: child2Uri });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canIssueChildren: '{ "category": "Achievement" }' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canIssueChildren).toEqual('{ "category": "Achievement" }');

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'usera',
                    uri: child1Uri,
                    credential: credential1,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({
                    from: 'userb',
                })
            ).toHaveLength(0);

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'usera',
                    uri: child2Uri,
                    credential: credential2,
                })
            ).resolves.not.toThrow();

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({
                    from: 'userb',
                })
            ).toHaveLength(1);
        });

        it('should allow you to use $in in queries', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Social Badge',
            });
            const child2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
            });
            const child3Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'ID',
            });

            const credential1 = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: child1Uri,
            });
            const credential2 = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: child2Uri,
            });
            const credential3 = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: child3Uri,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri: child1Uri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri: child2Uri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri: child3Uri });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canIssueChildren: '{ "category": { "$in": ["Achievement", "ID"] } }' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canIssueChildren).toEqual(
                '{ "category": { "$in": ["Achievement", "ID"] } }'
            );

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'usera',
                    uri: child1Uri,
                    credential: credential1,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({
                    from: 'userb',
                })
            ).toHaveLength(0);

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'usera',
                    uri: child2Uri,
                    credential: credential2,
                })
            ).resolves.not.toThrow();

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({
                    from: 'userb',
                })
            ).toHaveLength(1);

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'usera',
                    uri: child3Uri,
                    credential: credential3,
                })
            ).resolves.not.toThrow();

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({
                    from: 'userb',
                })
            ).toHaveLength(2);
        });

        it('should not allow you to issue any children via empty string', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: childUri,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canIssueChildren: '' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canIssueChildren).toEqual('');

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'usera',
                    uri: childUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({
                    from: 'userb',
                })
            ).toHaveLength(0);
        });

        it('should not allow you to issue any children via {}', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: childUri,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canIssueChildren: '{}' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canIssueChildren).toEqual('{}');

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'usera',
                    uri: childUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect(
                await userA.clients.fullAuth.credential.incomingCredentials({
                    from: 'userb',
                })
            ).toHaveLength(0);
        });
    });

    describe('canCreateChildren', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should allow you to override the canCreateChildren permission', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canCreateChildren).toEqual('*');

            expect(
                await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canCreateChildren: '' },
                })
            ).toBeTruthy();

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canCreateChildren).toEqual('');
        });

        it('should not allow you to set invalid JSON', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canCreateChildren).toEqual('*');

            await expect(
                userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canCreateChildren: 'not valid json!!!}' },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canCreateChildren).toEqual('*');
        });

        it('should apply to grandchildren', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: {
                    credential: testVc,
                },
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testUnsignedBoost },
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: grandParentUri,
            });
            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: grandParentUri,
                profileId: 'userb',
                updates: { canCreateChildren: '' },
            });

            const grandparentPermissions =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandParentUri,
                });

            expect(grandparentPermissions.canCreateChildren).toEqual('');

            const parentPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(parentPermissions.canCreateChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri: childUri,
                    boost: { credential: testUnsignedBoost },
                })
            ).resolves.not.toThrow();

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: grandParentUri,
                profileId: 'userb',
                updates: { canCreateChildren: '*' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canCreateChildren: '' },
            });

            const grandParentPermissions2 =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandParentUri,
                });

            expect(grandParentPermissions2.canCreateChildren).toEqual('*');

            const parentPermissions2 = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(parentPermissions2.canCreateChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri: childUri,
                    boost: { credential: testUnsignedBoost },
                })
            ).resolves.not.toThrow();

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: grandParentUri,
                profileId: 'userb',
                updates: { canCreateChildren: '' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canCreateChildren: '*' },
            });

            const grandParentPermissions3 =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandParentUri,
                });

            expect(grandParentPermissions3.canCreateChildren).toEqual('');

            const parentPermissions3 = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(parentPermissions3.canCreateChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri: childUri,
                    boost: { credential: testUnsignedBoost },
                })
            ).resolves.not.toThrow();

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: grandParentUri,
                profileId: 'userb',
                updates: { canCreateChildren: '' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canCreateChildren: '' },
            });

            const grandParentPermissions4 =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandParentUri,
                });

            expect(grandParentPermissions4.canCreateChildren).toEqual('');

            const parentPermissions4 = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(parentPermissions4.canCreateChildren).toEqual('');

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri: childUri,
                    boost: { credential: testUnsignedBoost },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to create any children via *', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canCreateChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost },
                })
            ).resolves.not.toThrow();

            const child2Uri = await userB.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await expect(
                userB.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri: child2Uri })
            ).resolves.not.toThrow();
        });

        it('should allow you to create only some children via a query', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canCreateChildren: '{ "category": "Achievement" }' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canCreateChildren).toEqual('{ "category": "Achievement" }');

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost, category: 'Social Badge' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost, category: 'Achievement' },
                })
            ).resolves.not.toThrow();
        });

        it('should allow you to use $in in queries', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canCreateChildren: '{ "category": { "$in": ["Achievement", "ID"] } }' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canCreateChildren).toEqual(
                '{ "category": { "$in": ["Achievement", "ID"] } }'
            );

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost, category: 'Social Badge' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost, category: 'Achievement' },
                })
            ).resolves.not.toThrow();

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost, category: 'ID' },
                })
            ).resolves.not.toThrow();
        });

        it('should not allow you to create any children via empty string', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canCreateChildren: '' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canCreateChildren).toEqual('');

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost, category: 'Social Badge' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost, category: 'Achievement' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost, category: 'ID' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should not allow you to create any children via {}', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canCreateChildren: '{}' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canCreateChildren).toEqual('{}');

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost, category: 'Social Badge' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost, category: 'Achievement' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testUnsignedBoost, category: 'ID' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });
    });

    describe('canEditChildren', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should allow you to override the canEditChildren permission', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canEditChildren).toEqual('*');

            expect(
                await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canEditChildren: '' },
                })
            ).toBeTruthy();

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canEditChildren).toEqual('');
        });

        it('should work with multiple parents', async () => {
            const parent1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: parent1Uri,
                boost: { credential: testUnsignedBoost, status: 'DRAFT' },
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ childUri, parentUri: parent2Uri });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parent1Uri,
            });
            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parent2Uri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent1Uri,
                profileId: 'userb',
                updates: { canEditChildren: '' },
            });

            const parent1Permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parent1Uri,
            });

            expect(parent1Permissions.canEditChildren).toEqual('');

            const parent2Permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parent2Uri,
            });

            expect(parent2Permissions.canEditChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: childUri,
                    updates: { category: 'Nice' },
                })
            ).resolves.not.toThrow();

            const updatedChild = await userA.clients.fullAuth.boost.getBoost({ uri: childUri });

            expect(updatedChild.category).toEqual('Nice');

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent1Uri,
                profileId: 'userb',
                updates: { canEditChildren: '*' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent2Uri,
                profileId: 'userb',
                updates: { canEditChildren: '' },
            });

            const parent1Permissions2 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent1Uri,
                }
            );

            expect(parent1Permissions2.canEditChildren).toEqual('*');

            const parent2Permissions2 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent2Uri,
                }
            );

            expect(parent2Permissions2.canEditChildren).toEqual('');

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: childUri,
                    updates: { category: 'Nice!!!' },
                })
            ).resolves.not.toThrow();

            const updatedChild2 = await userA.clients.fullAuth.boost.getBoost({ uri: childUri });

            expect(updatedChild2.category).toEqual('Nice!!!');

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent2Uri,
                profileId: 'userb',
                updates: { canEditChildren: '*' },
            });

            const parent1Permissions3 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent1Uri,
                }
            );

            expect(parent1Permissions3.canEditChildren).toEqual('*');

            const parent2Permissions3 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent2Uri,
                }
            );

            expect(parent2Permissions3.canEditChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: childUri,
                    updates: { category: 'Nice lol' },
                })
            ).resolves.not.toThrow();

            const updatedChild3 = await userA.clients.fullAuth.boost.getBoost({ uri: childUri });

            expect(updatedChild3.category).toEqual('Nice lol');

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent1Uri,
                profileId: 'userb',
                updates: { canEditChildren: '' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent2Uri,
                profileId: 'userb',
                updates: { canEditChildren: '' },
            });

            const parent1Permissions4 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent1Uri,
                }
            );

            expect(parent1Permissions4.canEditChildren).toEqual('');

            const parent2Permissions4 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent2Uri,
                }
            );

            expect(parent2Permissions4.canEditChildren).toEqual('');

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: childUri,
                    updates: { category: 'lol' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should apply to grandchildren', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testUnsignedBoost, status: 'DRAFT' },
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: grandParentUri,
            });
            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: grandParentUri,
                profileId: 'userb',
                updates: { canEditChildren: '' },
            });

            const grandparentPermissions =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandParentUri,
                });

            expect(grandparentPermissions.canEditChildren).toEqual('');

            const parentPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(parentPermissions.canEditChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: childUri,
                    updates: { category: 'Nice' },
                })
            ).resolves.not.toThrow();

            const updatedChild = await userA.clients.fullAuth.boost.getBoost({ uri: childUri });

            expect(updatedChild.category).toEqual('Nice');

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: grandParentUri,
                profileId: 'userb',
                updates: { canEditChildren: '*' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canEditChildren: '' },
            });

            const grandParentPermissions2 =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandParentUri,
                });

            expect(grandParentPermissions2.canEditChildren).toEqual('*');

            const parentPermissions2 = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(parentPermissions2.canEditChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: childUri,
                    updates: { category: 'Nice!!!' },
                })
            ).resolves.not.toThrow();

            const updatedChild2 = await userA.clients.fullAuth.boost.getBoost({ uri: childUri });

            expect(updatedChild2.category).toEqual('Nice!!!');

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: grandParentUri,
                profileId: 'userb',
                updates: { canEditChildren: '' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canEditChildren: '*' },
            });

            const grandParentPermissions3 =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandParentUri,
                });

            expect(grandParentPermissions3.canEditChildren).toEqual('');

            const parentPermissions3 = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(parentPermissions3.canEditChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: childUri,
                    updates: { category: 'Nice lol' },
                })
            ).resolves.not.toThrow();

            const updatedChild3 = await userA.clients.fullAuth.boost.getBoost({ uri: childUri });

            expect(updatedChild3.category).toEqual('Nice lol');

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: grandParentUri,
                profileId: 'userb',
                updates: { canEditChildren: '' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canEditChildren: '' },
            });

            const grandParentPermissions4 =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandParentUri,
                });

            expect(grandParentPermissions4.canEditChildren).toEqual('');

            const parentPermissions4 = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(parentPermissions4.canEditChildren).toEqual('');

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: childUri,
                    updates: { category: 'lol' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should not allow you to set invalid JSON', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canEditChildren).toEqual('*');

            await expect(
                userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canEditChildren: 'not valid json!!!}' },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canEditChildren).toEqual('*');
        });

        it('should allow you to edit any children via *', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                },
            });
            const child2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                },
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canEditChildren).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: child1Uri,
                    updates: { status: 'LIVE' },
                })
            ).resolves.not.toThrow();

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: child2Uri,
                    updates: { category: 'Nice' },
                })
            ).resolves.not.toThrow();
        });

        it('should allow you to edit only some children via a query', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Achievement',
                },
            });
            const child2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Social Badge',
                },
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canEditChildren: '{ "category": "Achievement" }' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canEditChildren).toEqual('{ "category": "Achievement" }');

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: child1Uri,
                    updates: { status: 'LIVE' },
                })
            ).resolves.not.toThrow();

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: child2Uri,
                    updates: { category: 'Nice' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to use $in in queries', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Achievement',
                },
            });
            const child2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Social Badge',
                },
            });
            const child3Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'ID',
                },
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canEditChildren: '{ "category": { "$in": ["Achievement", "ID"] } }' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canEditChildren).toEqual(
                '{ "category": { "$in": ["Achievement", "ID"] } }'
            );

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: child1Uri,
                    updates: { status: 'LIVE' },
                })
            ).resolves.not.toThrow();

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: child2Uri,
                    updates: { category: 'Nice' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: child3Uri,
                    updates: { category: 'Nice' },
                })
            ).resolves.not.toThrow();
        });

        it('should not allow you to edit any children via empty string', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Achievement',
                },
            });
            const child2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Social Badge',
                },
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canEditChildren: '' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canEditChildren).toEqual('');

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: child1Uri,
                    updates: { status: 'LIVE' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: child2Uri,
                    updates: { category: 'Nice' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should not allow you to edit any children via {}', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Achievement',
                },
            });
            const child2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Social Badge',
                },
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parentUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canEditChildren: '{}' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canEditChildren).toEqual('{}');

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: child1Uri,
                    updates: { status: 'LIVE' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: child2Uri,
                    updates: { category: 'Nice' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });
    });

    describe('canRevokeChildren (revocation is not implemented yet!)', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should allow you to override the canRevokeChildren permission', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canRevokeChildren).toEqual('*');

            expect(
                await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canRevokeChildren: '' },
                })
            ).toBeTruthy();

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canRevokeChildren).toEqual('');
        });

        it('should not allow you to set invalid JSON', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canRevokeChildren).toEqual('*');

            await expect(
                userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canRevokeChildren: 'not valid json!!!}' },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canRevokeChildren).toEqual('*');
        });
    });

    describe('canManageChildrenPermissions', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should allow you to override the canManageChildrenPermissions permission', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canManageChildrenPermissions).toEqual('*');

            expect(
                await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canManageChildrenPermissions: '' },
                })
            ).toBeTruthy();

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canManageChildrenPermissions).toEqual('');
        });

        it('should not allow you to set invalid JSON', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canManageChildrenPermissions).toEqual('*');

            await expect(
                userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canManageChildrenPermissions: 'not valid json!!!}' },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canManageChildrenPermissions).toEqual('*');
        });

        it('should work with multiple parents', async () => {
            const parent1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: parent1Uri,
                boost: { credential: testUnsignedBoost, status: 'DRAFT' },
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ childUri, parentUri: parent2Uri });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parent1Uri,
            });
            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: parent2Uri,
            });
            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userc',
                uri: childUri,
            });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent1Uri,
                profileId: 'userb',
                updates: { canManageChildrenPermissions: '' },
            });

            const parent1Permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parent1Uri,
            });

            expect(parent1Permissions.canManageChildrenPermissions).toEqual('');

            const parent2Permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parent2Uri,
            });

            expect(parent2Permissions.canManageChildrenPermissions).toEqual('*');

            const childPermissions = await userC.clients.fullAuth.boost.getBoostPermissions({
                uri: childUri,
            });

            expect(childPermissions.canEdit).toBeTruthy();

            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: childUri,
                    profileId: 'userc',
                    updates: { canEdit: false },
                })
            ).resolves.not.toThrow();

            const childPermissions2 = await userC.clients.fullAuth.boost.getBoostPermissions({
                uri: childUri,
            });

            expect(childPermissions2.canEdit).toBeFalsy();
            expect(childPermissions2.canIssue).toBeTruthy();

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent1Uri,
                profileId: 'userb',
                updates: { canManageChildrenPermissions: '*' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent2Uri,
                profileId: 'userb',
                updates: { canManageChildrenPermissions: '' },
            });

            const parent1Permissions2 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent1Uri,
                }
            );

            expect(parent1Permissions2.canManageChildrenPermissions).toEqual('*');

            const parent2Permissions2 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent2Uri,
                }
            );

            expect(parent2Permissions2.canManageChildrenPermissions).toEqual('');

            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: childUri,
                    profileId: 'userc',
                    updates: { canIssue: false },
                })
            ).resolves.not.toThrow();

            const childPermissions3 = await userC.clients.fullAuth.boost.getBoostPermissions({
                uri: childUri,
            });

            expect(childPermissions3.canIssue).toBeFalsy();
            expect(childPermissions3.canRevoke).toBeTruthy();

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent2Uri,
                profileId: 'userb',
                updates: { canManageChildrenPermissions: '*' },
            });

            const parent1Permissions3 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent1Uri,
                }
            );

            expect(parent1Permissions3.canManageChildrenPermissions).toEqual('*');

            const parent2Permissions3 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent2Uri,
                }
            );

            expect(parent2Permissions3.canManageChildrenPermissions).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: childUri,
                    profileId: 'userc',
                    updates: { canRevoke: false },
                })
            ).resolves.not.toThrow();

            const childPermissions4 = await userC.clients.fullAuth.boost.getBoostPermissions({
                uri: childUri,
            });

            expect(childPermissions4.canRevoke).toBeFalsy();
            expect(childPermissions4.canViewAnalytics).toBeTruthy();

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent1Uri,
                profileId: 'userb',
                updates: { canManageChildrenPermissions: '' },
            });
            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parent2Uri,
                profileId: 'userb',
                updates: { canManageChildrenPermissions: '' },
            });

            const parent1Permissions4 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent1Uri,
                }
            );

            expect(parent1Permissions4.canManageChildrenPermissions).toEqual('');

            const parent2Permissions4 = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                {
                    profileId: 'userb',
                    uri: parent2Uri,
                }
            );

            expect(parent2Permissions4.canManageChildrenPermissions).toEqual('');

            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: childUri,
                    profileId: 'userc',
                    updates: { canViewAnalytics: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            const childPermissions5 = await userC.clients.fullAuth.boost.getBoostPermissions({
                uri: childUri,
            });

            expect(childPermissions5.canViewAnalytics).toBeTruthy();
        });

        it('should allow you to manage any children via *', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                },
            });
            const child2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                },
            });

            await Promise.all([
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri: parentUri }),
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri: child1Uri }),
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri: child2Uri }),
            ]);

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canManageChildrenPermissions).toEqual('*');

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri: child1Uri,
                    updates: { canEdit: false },
                })
            ).resolves.not.toThrow();
            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: child1Uri,
                    profileId: 'userc',
                    updates: { canEdit: false },
                })
            ).resolves.not.toThrow();

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri: child2Uri,
                    updates: { canEdit: false },
                })
            ).resolves.not.toThrow();
            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: child2Uri,
                    profileId: 'userc',
                    updates: { canEdit: false },
                })
            ).resolves.not.toThrow();
        });

        it('should allow you to manage only some children via a query', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Achievement',
                },
            });
            const child2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Social Badge',
                },
            });

            await Promise.all([
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri: parentUri }),
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri: child1Uri }),
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri: child2Uri }),
            ]);

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canManageChildrenPermissions: '{ "category": "Achievement" }' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canManageChildrenPermissions).toEqual(
                '{ "category": "Achievement" }'
            );

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri: child1Uri,
                    updates: { canEdit: false },
                })
            ).resolves.not.toThrow();
            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: child1Uri,
                    profileId: 'userc',
                    updates: { canEdit: false },
                })
            ).resolves.not.toThrow();

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri: child2Uri,
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: child2Uri,
                    profileId: 'userc',
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to use $in in queries', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Achievement',
                },
            });
            const child2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Social Badge',
                },
            });
            const child3Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'ID',
                },
            });

            await Promise.all([
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri: parentUri }),
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri: child1Uri }),
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri: child2Uri }),
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri: child3Uri }),
            ]);

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: {
                    canManageChildrenPermissions:
                        '{ "category": { "$in": ["Achievement", "ID"] } }',
                },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canManageChildrenPermissions).toEqual(
                '{ "category": { "$in": ["Achievement", "ID"] } }'
            );

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri: child1Uri,
                    updates: { canEdit: false },
                })
            ).resolves.not.toThrow();
            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: child1Uri,
                    profileId: 'userc',
                    updates: { canEdit: false },
                })
            ).resolves.not.toThrow();

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri: child2Uri,
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: child2Uri,
                    profileId: 'userc',
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri: child3Uri,
                    updates: { canEdit: false },
                })
            ).resolves.not.toThrow();
            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: child3Uri,
                    profileId: 'userc',
                    updates: { canEdit: false },
                })
            ).resolves.not.toThrow();
        });

        it('should not allow you to manage any children via empty string', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Achievement',
                },
            });
            const child2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Social Badge',
                },
            });

            await Promise.all([
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri: parentUri }),
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri: child1Uri }),
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri: child2Uri }),
            ]);

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canManageChildrenPermissions: '' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canManageChildrenPermissions).toEqual('');

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri: child1Uri,
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: child1Uri,
                    profileId: 'userc',
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri: child2Uri,
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: child2Uri,
                    profileId: 'userc',
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should not allow you to manage any children via {}', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Achievement',
                },
            });
            const child2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    status: 'DRAFT',
                    category: 'Social Badge',
                },
            });

            await Promise.all([
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri: parentUri }),
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri: child1Uri }),
                userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userc', uri: child2Uri }),
            ]);

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri: parentUri,
                profileId: 'userb',
                updates: { canManageChildrenPermissions: '{}' },
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(permissions.canManageChildrenPermissions).toEqual('{}');

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri: child1Uri,
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: child1Uri,
                    profileId: 'userc',
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri: child2Uri,
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri: child2Uri,
                    profileId: 'userc',
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        (
            [
                ['canEditChildren', 'canEdit'],
                ['canIssueChildren', 'canIssue'],
                ['canRevokeChildren', 'canRevoke'],
            ] as const
        ).forEach(([permission, nonChildPermission]) => {
            describe(permission, () => {
                it(`can manage ${nonChildPermission} when it is true for the owner`, async () => {
                    const parentUri = await userA.clients.fullAuth.boost.createBoost({
                        credential: testUnsignedBoost,
                    });

                    const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                        parentUri,
                        boost: {
                            credential: testUnsignedBoost,
                            status: 'DRAFT',
                        },
                    });

                    await Promise.all([
                        userA.clients.fullAuth.boost.addBoostAdmin({
                            profileId: 'userb',
                            uri: parentUri,
                        }),
                        userA.clients.fullAuth.boost.addBoostAdmin({
                            profileId: 'userc',
                            uri: childUri,
                        }),
                    ]);

                    const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                        {
                            profileId: 'userb',
                            uri: parentUri,
                        }
                    );

                    expect(permissions.canManageChildrenPermissions).toEqual('*');
                    expect(permissions[permission]).toEqual('*');
                    expect(permissions[nonChildPermission]).toBeTruthy();

                    const otherPermissions = await userC.clients.fullAuth.boost.getBoostPermissions(
                        {
                            uri: childUri,
                        }
                    );

                    expect(otherPermissions[nonChildPermission]).toBeTruthy();

                    await expect(
                        userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                            profileId: 'userc',
                            uri: childUri,
                            updates: { [nonChildPermission]: false },
                        })
                    ).resolves.not.toThrow();

                    const newOtherPermissions =
                        await userC.clients.fullAuth.boost.getBoostPermissions({
                            uri: childUri,
                        });

                    expect(newOtherPermissions[nonChildPermission]).toBeFalsy();
                });

                it(`can manage ${nonChildPermission} when it is false for the owner`, async () => {
                    const parentUri = await userA.clients.fullAuth.boost.createBoost({
                        credential: testUnsignedBoost,
                    });

                    const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                        parentUri,
                        boost: {
                            credential: testUnsignedBoost,
                            status: 'DRAFT',
                        },
                    });

                    await Promise.all([
                        userA.clients.fullAuth.boost.addBoostAdmin({
                            profileId: 'userb',
                            uri: parentUri,
                        }),
                        userA.clients.fullAuth.boost.addBoostAdmin({
                            profileId: 'userc',
                            uri: childUri,
                        }),
                    ]);

                    await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                        profileId: 'userb',
                        uri: parentUri,
                        updates: { [nonChildPermission]: false },
                    });

                    const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions(
                        {
                            profileId: 'userb',
                            uri: parentUri,
                        }
                    );

                    expect(permissions.canManageChildrenPermissions).toEqual('*');
                    expect(permissions[nonChildPermission]).toBeFalsy();

                    const otherPermissions = await userC.clients.fullAuth.boost.getBoostPermissions(
                        {
                            uri: childUri,
                        }
                    );

                    expect(otherPermissions[nonChildPermission]).toBeTruthy();

                    await expect(
                        userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                            profileId: 'userc',
                            uri: childUri,
                            updates: { [nonChildPermission]: false },
                        })
                    ).resolves.not.toThrow();

                    const newOtherPermissions =
                        await userC.clients.fullAuth.boost.getBoostPermissions({
                            uri: childUri,
                        });

                    expect(newOtherPermissions[nonChildPermission]).toBeFalsy();
                });
            });
        });
    });

    describe('canViewAnalytics', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should allow you to override the canViewAnalytics permission', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions.canViewAnalytics).toBeTruthy();

            expect(
                await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canViewAnalytics: false },
                })
            ).toBeTruthy();

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions.canViewAnalytics).toBeFalsy();
        });
    });

    describe('Default Roles', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
                did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });
        });

        it('should allow you to set default roles when claiming', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                claimPermissions: adminRole,
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: uri,
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions).toEqual(emptyRole);

            const sentUri = await userA.clients.fullAuth.boost.sendBoost({
                credential,
                profileId: 'userb',
                uri,
            });

            await userB.clients.fullAuth.credential.acceptCredential({ uri: sentUri });

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions).toEqual(adminRole);
        });

        it('should allow any combination of permissions', async () => {
            const role: BoostPermissions = {
                role: 'nice',
                canEdit: true,
                canIssue: false,
                canRevoke: true,
                canManagePermissions: false,
                canIssueChildren: '*',
                canCreateChildren: '',
                canEditChildren: '*',
                canRevokeChildren: '',
                canManageChildrenPermissions: '*',
                canManageChildrenProfiles: false,
                canViewAnalytics: false,
            };

            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                claimPermissions: role,
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: uri,
            });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions).toEqual(emptyRole);

            const sentUri = await userA.clients.fullAuth.boost.sendBoost({
                credential,
                profileId: 'userb',
                uri,
            });

            await userB.clients.fullAuth.credential.acceptCredential({ uri: sentUri });

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions).toEqual(role);
        });

        it('should work with claim links', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                claimPermissions: adminRole,
            });

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });
            if (sa) {
                const claimLinkSA = {
                    endpoint: sa.signingAuthority.endpoint,
                    name: sa.relationship.name,
                };
                const challenge = 'mychallenge';

                await expect(
                    userA.clients.fullAuth.boost.generateClaimLink({
                        boostUri: uri,
                        challenge,
                        claimLinkSA,
                    })
                ).resolves.toMatchObject({
                    boostUri: uri,
                    challenge,
                });

                const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri,
                });

                expect(permissions).toEqual(emptyRole);

                await userB.clients.fullAuth.boost.claimBoostWithLink({ boostUri: uri, challenge });

                const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri,
                });

                expect(newPermissions).toEqual(adminRole);
            } else {
                expect(sa).toBeDefined();
            }
        });
    });
});
