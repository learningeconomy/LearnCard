import { createTRPCUntypedClient, httpLink, TRPCClientError } from '@trpc/client';
import { z } from 'zod';
import type { AgentConfig } from './config';
import { AgentError } from './redact';
import {
    operationSchema,
    type BrainClient,
    type Operation,
    type Observation,
    type Lease,
} from './types';

export const createBrainClient = (config: AgentConfig): BrainClient => {
    const client = createTRPCUntypedClient({
        links: [
            httpLink({
                url: `${config.BRAIN_URL.replace(/\/$/, '')}/trpc`,
                headers: { 'x-workload-agent-token': config.WORKLOAD_AGENT_TOKEN },
                fetch: (url, options): Promise<Response> =>
                    fetch(url, { ...options, signal: AbortSignal.timeout(2500) }),
            }),
        ],
    });
    const call = async (name: string, input: unknown, query = false): Promise<unknown> => {
        try {
            return await client[query ? 'query' : 'mutation'](`workloadAgent.${name}`, input);
        } catch (error) {
            if (error instanceof TRPCClientError && error.data?.code === 'CONFLICT')
                throw new AgentError('CONFLICT');
            throw new AgentError('BRAIN_REQUEST_FAILED');
        }
    };
    return {
        list: async (): Promise<Operation[]> =>
            operationSchema
                .array()
                .parse(await call('listPendingWorkloadOperations', { limit: 50 }, true)),
        claim: async (operationId: string): Promise<Operation> =>
            operationSchema.parse(await call('claimWorkloadOperation', { operationId })),
        observe: async (lease: Lease, observation: Observation): Promise<void> => {
            z.literal(true).parse(
                await call('reportWorkloadObservation', { ...lease, observation })
            );
        },
        complete: async (lease: Lease, status: 'SUCCEEDED' | 'FAILED'): Promise<void> => {
            z.literal(true).parse(await call('completeWorkloadOperation', { ...lease, status }));
        },
        health: async (deploymentId: string, observation: Observation): Promise<void> => {
            const { observedRevision, components, endpoints } = observation;
            z.literal(true).parse(
                await call('reportDeploymentHealth', {
                    deploymentId,
                    observedRevision,
                    components,
                    endpoints,
                })
            );
        },
    };
};
