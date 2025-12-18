import { CredentialRecord } from '@learncard/types';
import { CredentialCategory } from './credentials';

export type CredentialMetadata = {
    category: CredentialCategory;
    title?: string;
    imgUrl?: string;
    subcategory?: string;
    from?: string;
    date?: string;
    sharedUris?: Record<string, string[]>; // {'contractUri': ['boostUri1', 'boostUri2']}
    contractUri?: string;
    boostUri?: string;
    __v?: number;
};

export type LCR = CredentialRecord<CredentialMetadata>;
