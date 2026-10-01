import { TRPCError } from '@trpc/server';
import { neogma } from '@instance';
export { provisionIntegrationServiceAccount } from '@accesslayer/service-account/internal';

import {
    AppAvailability,
    IntegrationInstall,
    RegistrySubscription,
    WalletEnablement,
    WorkloadDeployment,
} from '@models';
import {
    AppAvailabilityType,
    IntegrationInstallType,
    RegistrySubscriptionType,
    WalletEnablementType,
    WorkloadDeploymentType,
} from 'types/install-target';

type InstallTargetRecord =
    | IntegrationInstallType
    | AppAvailabilityType
    | WalletEnablementType
    | WorkloadDeploymentType
    | RegistrySubscriptionType;

export const readInstallTargetInternal = async (
    input: Pick<InstallTargetRecord, 'id' | 'targetType'>
): Promise<InstallTargetRecord | null> => {
    switch (input.targetType) {
        case 'INTEGRATION_INSTALL':
            return (await IntegrationInstall.findOne({
                where: { id: input.id },
                plain: true,
            })) as IntegrationInstallType | null;
        case 'APP_AVAILABILITY':
            return (await AppAvailability.findOne({
                where: { id: input.id },
                plain: true,
            })) as AppAvailabilityType | null;
        case 'WALLET_ENABLEMENT':
            return (await WalletEnablement.findOne({
                where: { id: input.id },
                plain: true,
            })) as WalletEnablementType | null;
        case 'WORKLOAD_DEPLOYMENT':
            return (await WorkloadDeployment.findOne({
                where: { id: input.id },
                plain: true,
            })) as WorkloadDeploymentType | null;
        case 'REGISTRY_SUBSCRIPTION':
            return (await RegistrySubscription.findOne({
                where: { id: input.id },
                plain: true,
            })) as RegistrySubscriptionType | null;
    }
};

export const listInstallTargetsByIntentId = async (
    intentId: string
): Promise<InstallTargetRecord[]> => {
    const [
        integrationInstalls,
        appAvailabilities,
        walletEnablements,
        workloadDeployments,
        registrySubscriptions,
    ] = await Promise.all([
        IntegrationInstall.findMany({ where: { intentId }, plain: true }),
        AppAvailability.findMany({ where: { intentId }, plain: true }),
        WalletEnablement.findMany({ where: { intentId }, plain: true }),
        WorkloadDeployment.findMany({ where: { intentId }, plain: true }),
        RegistrySubscription.findMany({ where: { intentId }, plain: true }),
    ]);

    return [
        ...(integrationInstalls as IntegrationInstallType[]),
        ...(appAvailabilities as AppAvailabilityType[]),
        ...(walletEnablements as WalletEnablementType[]),
        ...(workloadDeployments as WorkloadDeploymentType[]),
        ...(registrySubscriptions as RegistrySubscriptionType[]),
    ];
};

export const listInstallTargetsByEcosystemId = async (
    ecosystemId: string
): Promise<InstallTargetRecord[]> => {
    const [
        integrationInstalls,
        appAvailabilities,
        walletEnablements,
        workloadDeployments,
        registrySubscriptions,
    ] = await Promise.all([
        IntegrationInstall.findMany({ where: { ecosystemId }, plain: true }),
        AppAvailability.findMany({ where: { ecosystemId }, plain: true }),
        WalletEnablement.findMany({ where: { ecosystemId }, plain: true }),
        WorkloadDeployment.findMany({ where: { ecosystemId }, plain: true }),
        RegistrySubscription.findMany({ where: { ecosystemId }, plain: true }),
    ]);

    return [
        ...(integrationInstalls as IntegrationInstallType[]),
        ...(appAvailabilities as AppAvailabilityType[]),
        ...(walletEnablements as WalletEnablementType[]),
        ...(workloadDeployments as WorkloadDeploymentType[]),
        ...(registrySubscriptions as RegistrySubscriptionType[]),
    ];
};

export const listWorkloadDeploymentsByEcosystemId = async (
    ecosystemId: string
): Promise<WorkloadDeploymentType[]> =>
    (await WorkloadDeployment.findMany({
        where: { ecosystemId },
        plain: true,
    })) as WorkloadDeploymentType[];

export const listRegistrySubscriptionsByEcosystemId = async (
    ecosystemId: string
): Promise<RegistrySubscriptionType[]> =>
    (await RegistrySubscription.findMany({
        where: { ecosystemId },
        plain: true,
    })) as RegistrySubscriptionType[];

export const deleteInstallTargetInternal = async (
    input: Pick<InstallTargetRecord, 'id' | 'targetType'>
): Promise<void> => {
    switch (input.targetType) {
        case 'INTEGRATION_INSTALL':
            await neogma.queryRunner.run(
                `MATCH ()-[install:INSTALLS {installId: $id}]->() DELETE install`,
                { id: input.id }
            );
            await IntegrationInstall.delete({ detach: true, where: { id: input.id } });
            return;
        case 'APP_AVAILABILITY':
            await AppAvailability.delete({ where: { id: input.id } });
            return;
        case 'WALLET_ENABLEMENT':
            await WalletEnablement.delete({ where: { id: input.id } });
            return;
        case 'WORKLOAD_DEPLOYMENT':
            await WorkloadDeployment.delete({ where: { id: input.id } });
            return;
        case 'REGISTRY_SUBSCRIPTION':
            await RegistrySubscription.delete({ where: { id: input.id } });
            return;
        default:
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Unsupported install target type.',
            });
    }
};

export const createInstallTargetInternal = async (
    input: InstallTargetRecord
): Promise<InstallTargetRecord> => {
    switch (input.targetType) {
        case 'INTEGRATION_INSTALL':
            await IntegrationInstall.createOne(input);
            // Explicit target restoration may reconnect its existing principal, but
            // never re-enable it or recreate grants. Health itself never repairs edges.
            await neogma.queryRunner.run(
                `MATCH (sa:ServiceAccount {installId: $id}) WHERE sa.status <> 'REVOKED'
                 WITH collect(sa) AS accounts WHERE size(accounts) = 1
                 MATCH (target:IntegrationInstall {id: $id})
                 MATCH (eco:Ecosystem {id: target.ecosystemId}), (listing:AppStoreListing {listing_id: target.listingId})
                 FOREACH (sa IN accounts |
                   MERGE (target)-[:HAS_SERVICE_ACCOUNT]->(sa)
                   MERGE (eco)-[install:INSTALLS {installId: $id}]->(listing)
                   ON CREATE SET install.serviceAccountId = sa.id, install.listingKind = 'INTEGRATION',
                     install.status = sa.status, install.installedAt = sa.createdAt)`,
                { id: input.id }
            );
            return input;
        case 'APP_AVAILABILITY':
            await AppAvailability.createOne(input);
            return input;
        case 'WALLET_ENABLEMENT':
            await WalletEnablement.createOne(input);
            return input;
        case 'WORKLOAD_DEPLOYMENT':
            await WorkloadDeployment.createOne(input);
            return input;
        case 'REGISTRY_SUBSCRIPTION':
            await RegistrySubscription.createOne(input);
            return input;
        default:
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Unsupported install target type.',
            });
    }
};

export const ensureInstallTargetInternal = async (
    input: InstallTargetRecord
): Promise<InstallTargetRecord> => {
    const existing = await readInstallTargetInternal(input);

    if (existing) {
        return existing;
    }

    return createInstallTargetInternal(input);
};
