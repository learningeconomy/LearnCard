import type { AgentToolDefinition } from '../agent/types';
import type { ConsentedUserDataResult } from '../consentFlow';

export interface ConsentedUserDataToolConfig {
    did: string;
    loadData: () => Promise<ConsentedUserDataResult>;
}

const consentedUserDataParameters = {
    type: 'object',
    properties: {},
    additionalProperties: false,
};

export const createConsentedUserDataTool = ({
    did,
    loadData,
}: ConsentedUserDataToolConfig): AgentToolDefinition => {
    let dataPromise: Promise<ConsentedUserDataResult> | undefined;

    return {
        name: 'getConsentedUserData',
        description: `Gets data consented by the current user (${did}) through the configured ConsentFlow contract.`,
        parameters: consentedUserDataParameters,
        execute: async () => {
            dataPromise ??= loadData();

            return dataPromise;
        },
    };
};
