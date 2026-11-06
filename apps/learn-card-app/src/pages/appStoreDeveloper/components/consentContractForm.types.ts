import type { ConsentFlowContractDetails } from '@learncard/types';

export type ConsentContractFormValue = Pick<
    ConsentFlowContractDetails,
    | 'contract'
    | 'name'
    | 'subtitle'
    | 'description'
    | 'image'
    | 'reasonForAccessing'
    | 'needsGuardianConsent'
    | 'redirectUrl'
>;
