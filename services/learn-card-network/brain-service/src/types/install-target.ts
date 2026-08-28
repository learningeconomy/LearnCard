import { z } from 'zod';

import { InstallTargetValidator } from '@learncard/types';

// listingId joins a target back to its catalog listing; optional because
// legacy target nodes predate the field.
const CatalogAwareInstallTargetValidator = InstallTargetValidator.extend({
    listingId: z.string().optional(),
});

export const IntegrationInstallValidator = CatalogAwareInstallTargetValidator.extend({
    targetType: z.literal('INTEGRATION_INSTALL'),
});
export type IntegrationInstallType = z.infer<typeof IntegrationInstallValidator>;

export const AppAvailabilityValidator = CatalogAwareInstallTargetValidator.extend({
    targetType: z.literal('APP_AVAILABILITY'),
});
export type AppAvailabilityType = z.infer<typeof AppAvailabilityValidator>;

export const WalletEnablementValidator = CatalogAwareInstallTargetValidator.extend({
    targetType: z.literal('WALLET_ENABLEMENT'),
});
export type WalletEnablementType = z.infer<typeof WalletEnablementValidator>;

export const WorkloadDeploymentValidator = CatalogAwareInstallTargetValidator.extend({
    targetType: z.literal('WORKLOAD_DEPLOYMENT'),
});
export type WorkloadDeploymentType = z.infer<typeof WorkloadDeploymentValidator>;

export const RegistrySubscriptionValidator = CatalogAwareInstallTargetValidator.extend({
    targetType: z.literal('REGISTRY_SUBSCRIPTION'),
});
export type RegistrySubscriptionType = z.infer<typeof RegistrySubscriptionValidator>;

export const EnrichedInstallTargetFieldsValidator = z.object({
    displayName: z.string().optional(),
    tagline: z.string().optional(),
});

export const EnrichedWorkloadDeploymentValidator = WorkloadDeploymentValidator.extend(
    EnrichedInstallTargetFieldsValidator.shape
);
export type EnrichedWorkloadDeploymentType = z.infer<typeof EnrichedWorkloadDeploymentValidator>;

export const EnrichedRegistrySubscriptionValidator = RegistrySubscriptionValidator.extend(
    EnrichedInstallTargetFieldsValidator.shape
);
export type EnrichedRegistrySubscriptionType = z.infer<
    typeof EnrichedRegistrySubscriptionValidator
>;
