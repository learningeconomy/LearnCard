import type { AgentToolDefinition } from '../agent/types';
import type { ConsentedUserDataResult } from '../consentFlow';

export interface ConsentedUserDataToolConfig {
    did: string;
    dataPromise: Promise<ConsentedUserDataResult>;
}

const consentedUserDataParameters = {
    type: 'object',
    properties: {},
    additionalProperties: false,
};

export const createConsentedUserDataTool = ({
    did,
    dataPromise,
}: ConsentedUserDataToolConfig): AgentToolDefinition => ({
    name: 'getConsentedUserData',
    description: `Gets data consented by the current user (${did}) through the configured ConsentFlow contract. The load starts before the agent loop and this tool waits for it to finish.`,
    parameters: consentedUserDataParameters,
    execute: async () => dataPromise,
});
