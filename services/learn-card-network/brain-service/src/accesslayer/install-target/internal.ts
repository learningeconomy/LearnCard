import { TRPCError } from '@trpc/server';

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

const readInstallTargetInternal = async (
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

export const deleteInstallTargetInternal = async (
    input: Pick<InstallTargetRecord, 'id' | 'targetType'>
): Promise<void> => {
    switch (input.targetType) {
        case 'INTEGRATION_INSTALL':
            await IntegrationInstall.delete({ where: { id: input.id } });
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
