declare module 'hex-lite' {
    function toUint8Array(hex: string): Uint8Array;
    function fromUint8Array(array: Uint8Array): string;
    function toBuffer(hex: string): ArrayBuffer;
    function fromBuffer(buffer: ArrayBuffer): string;
}

declare module '*docs/snippets/consentflow/update-contract.mjs' {
    import type { LearnCardNetworkPluginMethods } from '@learncard/network-plugin';
    import type { ConsentFlowContractUpdateResult } from '@learncard/types';

    export const updateTutorialContract: (
        learnCard: { invoke: Pick<LearnCardNetworkPluginMethods, 'updateContract'> },
        contractUri: string,
        options?: { apply?: boolean }
    ) => Promise<ConsentFlowContractUpdateResult>;
}
