import { z } from 'zod';

import {
    LCNIntegrationValidator,
    LCNIntegrationCreateValidator,
    LCNIntegrationUpdateValidator,
    LCNDomainOrOriginValidator,
} from '@learncard/types';

export const IntegrationValidator = LCNIntegrationValidator;
export type IntegrationType = z.infer<typeof IntegrationValidator>;

export const FlatIntegrationValidator = IntegrationValidator.catchall(z.any());
export type FlatIntegrationType = z.infer<typeof FlatIntegrationValidator>;

export const IntegrationCreateValidator = LCNIntegrationCreateValidator;
export type IntegrationCreateType = z.infer<typeof IntegrationCreateValidator>;

export const IntegrationUpdateValidator = LCNIntegrationUpdateValidator;
export type IntegrationUpdateType = z.infer<typeof IntegrationUpdateValidator>;

export const DomainOrOriginValidator = LCNDomainOrOriginValidator;
