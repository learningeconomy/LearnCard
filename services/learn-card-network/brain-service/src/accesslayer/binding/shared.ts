import { TRPCError } from '@trpc/server';

import {
    BindingEndpoint,
    BindingEndpointValidator,
    BindingRevisionsValidator,
} from '@learncard/types';
import { Binding, Ecosystem } from '@models';
import { neogma } from '@instance';
import { BindingRecordType, BindingRecordValidator, FlatBindingType } from 'types/binding';

const nodeLabelForEndpoint = (endpoint: BindingEndpoint): string => {
    switch (endpoint.resourceType) {
        case 'INTEGRATION_INSTALL':
            return 'IntegrationInstall';
        case 'APP_AVAILABILITY':
            return 'AppAvailability';
        case 'WALLET_ENABLEMENT':
            return 'WalletEnablement';
        case 'WORKLOAD_DEPLOYMENT':
            return 'WorkloadDeployment';
        case 'REGISTRY_SUBSCRIPTION':
            return 'RegistrySubscription';
        case 'ECOSYSTEM':
            return 'Ecosystem';
    }
};

export const inflateBinding = (flat: FlatBindingType): BindingRecordType => {
    return BindingRecordValidator.parse({
        ...flat,
        provider: BindingEndpointValidator.parse(JSON.parse(flat.provider)),
        consumer: BindingEndpointValidator.parse(JSON.parse(flat.consumer)),
        revisions: BindingRevisionsValidator.parse(JSON.parse(flat.revisions)),
    });
};

export const getBindingRecord = async (bindingId: string): Promise<BindingRecordType | null> => {
    const flat = await Binding.findOne({ where: { bindingId }, plain: true });

    return flat ? inflateBinding(flat as FlatBindingType) : null;
};

export const requireBindingRecord = async (bindingId: string): Promise<BindingRecordType> => {
    const binding = await getBindingRecord(bindingId);

    if (!binding) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Binding ${bindingId} not found.` });
    }

    return binding;
};

export const serializeBindingRecord = (record: BindingRecordType): FlatBindingType => ({
    ...record,
    provider: JSON.stringify(record.provider),
    consumer: JSON.stringify(record.consumer),
    revisions: JSON.stringify(record.revisions),
});

export const writeBindingRecord = async (record: BindingRecordType): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (binding:Binding { bindingId: $bindingId })
         SET binding += $patch`,
        { bindingId: record.bindingId, patch: serializeBindingRecord(record) }
    );
};

export const createBindingEdges = async (record: BindingRecordType): Promise<void> => {
    const ecosystem = await Ecosystem.findOne({ where: { id: record.ecosystemId }, plain: true });

    if (!ecosystem) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Ecosystem ${record.ecosystemId} not found.`,
        });
    }

    await neogma.queryRunner.run(
        `MATCH (ecosystem:Ecosystem { id: $ecosystemId })
         MATCH (binding:Binding { bindingId: $bindingId })
         MERGE (ecosystem)-[:OWNS_BINDING]->(binding)`,
        { ecosystemId: record.ecosystemId, bindingId: record.bindingId }
    );

    const providerLabel = nodeLabelForEndpoint(record.provider);
    const consumerLabel = nodeLabelForEndpoint(record.consumer);

    await neogma.queryRunner.run(
        `MATCH (binding:Binding { bindingId: $bindingId })
         MATCH (provider:${providerLabel} { id: $providerId })
         MERGE (binding)-[:BINDS_PROVIDER]->(provider)`,
        { bindingId: record.bindingId, providerId: record.provider.resourceId }
    );

    await neogma.queryRunner.run(
        `MATCH (binding:Binding { bindingId: $bindingId })
         MATCH (consumer:${consumerLabel} { id: $consumerId })
         MERGE (binding)-[:BINDS_CONSUMER]->(consumer)`,
        { bindingId: record.bindingId, consumerId: record.consumer.resourceId }
    );
};
