import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { neogma } from '@instance';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { ServiceAccount } from '@models';
import { reconcileInstallIntent } from '@reconciler';
import { exchangeServiceAccountCredential } from '@accesslayer/service-account/auth';
import { requireServiceAccountAccess } from '@helpers/ecosystem-access.helpers';
import {
    setupServiceAccount,
    partnerClient,
    partnerContext,
} from './helpers/service-account.helpers';
import { makeListingInput } from './helpers/app-store.helpers';
import { createSignedListingVersionForKind } from './helpers/manifest.helpers';

const setup = async (selector?: string) => {
    const { ecosystem: root, client, profileId } = await setupServiceAccount();
    const createChild = (parentEcosystemId: string | null) =>
        createEcosystem({
            name: 'Isolation',
            slug: `isolation-${randomUUID()}`,
            ownerProfileId: profileId,
            parentEcosystemId,
            description: undefined,
            settings: {},
            status: 'ACTIVE',
        });
    const installEco = await createChild(root.id);
    const descendant = await createChild(installEco.id);
    const sibling = await createChild(root.id);
    const unrelated = await createChild(null);
    const groups: Record<string, string> = {};
    for (const [name, eco] of Object.entries({
        ancestor: root,
        install: installEco,
        descendant,
        sibling,
        unrelated,
    })) {
        groups[name] = `group_${randomUUID()}`;
        await neogma.queryRunner.run(
            'CREATE (:Group {id: $id, name: $name, type: "CUSTOM", ownerEcosystemId: $owner, members: ["private-profile"]})',
            { id: groups[name], name, owner: eco.id }
        );
    }
    const listingId = `listing_${randomUUID()}`,
        versionId = `version_${randomUUID()}`;
    await createAppStoreListing(
        makeListingInput({
            listing_id: listingId,
            kind: 'INTEGRATION',
            app_listing_status: 'LISTED',
        })
    );
    await createSignedListingVersionForKind({
        listingId,
        versionId,
        kind: 'INTEGRATION',
        manifestOverrides: {
            endpoints: {},
            scopes: [
                {
                    resource: 'group',
                    action: 'read',
                    selectorKind: selector ? 'id' : 'tree',
                    selectorValue: selector ? groups[selector]! : '$installEcosystemId',
                    reason: 'Metadata only',
                },
            ],
        },
    });
    const planned = await client.installIntent.planInstallIntent({
        ecosystemId: installEco.id,
        listingId,
        versionId,
        requestedConfig: {},
        proposedBindings: [],
    });
    await client.installIntent.approveInstallIntent({
        intentId: planned.intentId,
        planHash: planned.plan.planHash,
        planRevision: planned.plan.planRevision,
        consentTiers: [],
    });
    await reconcileInstallIntent(planned.intentId);
    const account = await ServiceAccount.findOne({
        where: { ecosystemId: installEco.id },
        plain: true,
    });
    if (!account) throw new Error('Missing account');
    const issued = await client.installIntent.issueServiceAccountCredential({
        serviceAccountId: account.id,
    });
    // This suite isolates request authorization; enable-gate behavior has its own suite.
    await neogma.queryRunner.run('MATCH (sa:ServiceAccount {id: $id}) SET sa.status = "ENABLED"', {
        id: account.id,
    });
    const token = await exchangeServiceAccountCredential(account.id, issued.secret);
    return {
        account,
        client,
        groups,
        token,
        partner: await partnerClient(token),
        ecosystem: installEco,
        intentId: planned.intentId,
    };
};

describe('Integration isolation — threat model §10.2 #3', () => {
    it('permits in-tree group:read metadata only and denies sibling, ancestor and unrelated trees', async () => {
        const { partner, groups } = await setup();
        for (const name of ['install', 'descendant'])
            expect(await partner.integrationService.readGroup({ groupId: groups[name]! })).toEqual({
                id: groups[name],
                name,
                type: 'CUSTOM',
                parent: null,
            });
        for (const name of ['sibling', 'ancestor', 'unrelated'])
            await expect(
                partner.integrationService.readGroup({ groupId: groups[name]! })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
    it('ignores a forged in-tree ecosystem argument and resolves the target owner from the graph', async () => {
        const { partner, groups, ecosystem } = await setup();
        const forged = { groupId: groups.unrelated!, ecosystemId: ecosystem.id };
        await expect(partner.integrationService.readGroup(forged)).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
    });
    it('requires an exact id selector and never treats it as a subtree', async () => {
        const { partner, groups } = await setup('install');
        await expect(
            partner.integrationService.readGroup({ groupId: groups.install! })
        ).resolves.toMatchObject({ id: groups.install });
        await expect(
            partner.integrationService.readGroup({ groupId: groups.descendant! })
        ).rejects.toThrow();
    });
    it('denies non-granted actions, all subject-data operations and capability access without ACTIVE Binding', async () => {
        const { token, groups } = await setup();
        const { serviceAccount: principal } = await partnerContext(token);
        for (const [resource, action] of [
            ['group', 'sync'],
            ['group', 'write'],
            ['profile', 'read'],
            ['boost', 'read'],
        ]) {
            await expect(
                requireServiceAccountAccess({
                    principal,
                    resource: resource!,
                    action: action!,
                    target: groups.install!,
                })
            ).rejects.toThrow();
        }
        await expect(
            requireServiceAccountAccess({
                principal,
                resource: 'group',
                action: 'read',
                target: groups.install!,
                capability: 'roster-source',
            })
        ).rejects.toThrow();
    });
    it('denies an ungranted read and PROVISIONED status even with a valid token', async () => {
        const { token, partner, groups, account } = await setup();
        await neogma.queryRunner.run(
            'MATCH (sa:ServiceAccount {id: $id}) SET sa.status = "PROVISIONED"',
            { id: account.id }
        );
        await expect(
            partner.integrationService.readGroup({ groupId: groups.install! })
        ).rejects.toThrow();
        await neogma.queryRunner.run(
            'MATCH (sa:ServiceAccount {id: $id})-[:HAS_GRANT]->(g) SET sa.status = "ENABLED", g.action = "sync"',
            { id: account.id }
        );
        await expect(
            (await partnerClient(token)).integrationService.readGroup({ groupId: groups.install! })
        ).rejects.toThrow();
    });
    it('denies immediately after credential reissue, uninstall and emergency revoke', async () => {
        const first = await setup();
        await first.client.installIntent.issueServiceAccountCredential({
            serviceAccountId: first.account.id,
        });
        await expect(
            first.partner.integrationService.readGroup({ groupId: first.groups.install! })
        ).rejects.toThrow();
        const second = await setup();
        await reconcileInstallIntent(second.intentId, { operation: 'remove' });
        await expect(
            second.partner.integrationService.readGroup({ groupId: second.groups.install! })
        ).rejects.toThrow();
        const third = await setup();
        await third.client.installIntent.emergencyRevokeServiceAccount({
            serviceAccountId: third.account.id,
        });
        await expect(
            third.partner.integrationService.readGroup({ groupId: third.groups.install! })
        ).rejects.toThrow();
    });
});
