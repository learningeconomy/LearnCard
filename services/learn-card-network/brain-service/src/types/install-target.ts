import { z } from 'zod';

import { InstallTargetValidator } from '@learncard/types';

export const IntegrationInstallValidator = InstallTargetValidator.extend({
    targetType: z.literal('INTEGRATION_INSTALL'),
});
export type IntegrationInstallType = z.infer<typeof IntegrationInstallValidator>;

export const AppAvailabilityValidator = InstallTargetValidator.extend({
    targetType: z.literal('APP_AVAILABILITY'),
});
export type AppAvailabilityType = z.infer<typeof AppAvailabilityValidator>;

export const WalletEnablementValidator = InstallTargetValidator.extend({
    targetType: z.literal('WALLET_ENABLEMENT'),
});
export type WalletEnablementType = z.infer<typeof WalletEnablementValidator>;

export const WorkloadDeploymentValidator = InstallTargetValidator.extend({
    targetType: z.literal('WORKLOAD_DEPLOYMENT'),
});
export type WorkloadDeploymentType = z.infer<typeof WorkloadDeploymentValidator>;

export const RegistrySubscriptionValidator = InstallTargetValidator.extend({
    targetType: z.literal('REGISTRY_SUBSCRIPTION'),
});
export type RegistrySubscriptionType = z.infer<typeof RegistrySubscriptionValidator>;
