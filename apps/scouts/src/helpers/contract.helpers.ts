import {
    ConsentFlowContract,
    ConsentFlowContractDetails,
    ConsentFlowTerms,
} from '@learncard/types';
import { CurrentUser, getBaseUrl } from 'learn-card-base';

import BrokenLink from '../components/svgs/BrokenLink';
import { boostCategoryOptions } from '../components/boost/boost-options/boostOptions';

export const getPersonalEntry = (key: string, user?: CurrentUser | null, anonymize = true) => {
    if (key.toLowerCase() === 'name') return anonymize ? 'Anonymous' : user?.name ?? '';
    if (key.toLowerCase() === 'email') return anonymize ? 'alice@gmail.com' : user?.email ?? '';
    if (key.toLowerCase() === 'image') {
        return anonymize
            ? 'https://cdn.filestackcontent.com/52hRlXLIQVBi4fYpB1xw'
            : user?.profileImage ?? '';
    }

    return '';
};

export const getMinimumTermsForContract = (
    contract: ConsentFlowContract,
    user: CurrentUser
): ConsentFlowTerms => {
    const terms: ConsentFlowTerms = {
        read: {
            anonymize: contract.read.anonymize ?? true,
            credentials: { shareAll: false, sharing: true, categories: {} },
            personal: {},
        },
        write: {
            credentials: { categories: {} },
            personal: {},
        },
    };

    const contractPersonalReadEntries = Object.entries(contract.read?.personal ?? {});
    const contractPersonalWriteEntries = Object.entries(contract.write?.personal ?? {});
    const contractCategoryReadEntries = Object.entries(
        contract.read?.credentials?.categories ?? {}
    );
    const contractCategoryWriteEntries = Object.entries(
        contract.write?.credentials?.categories ?? {}
    );

    contractPersonalReadEntries.forEach(([key, value]) => {
        terms.read.personal[key] = value.required
            ? getPersonalEntry(key, user, contract.read.anonymize ?? true)
            : '';
    });
    contractPersonalWriteEntries.forEach(([key, value]) => {
        terms.write.personal[key] = value.required;
    });
    contractCategoryReadEntries.forEach(([key, value]) => {
        terms.read.credentials.categories[key] = {
            shareAll: false,
            sharing: value.required,
            shared: [],
        };
    });
    contractCategoryWriteEntries.forEach(([key, value]) => {
        terms.write.credentials.categories[key] = value.required;
    });

    return terms;
};

export const getInfoFromContractKey = (key: string) => {
    const options = boostCategoryOptions[key];

    if (options) {
        return {
            IconComponent: options.IconComponent,
            title: options.title,
            plural: `${key}s`,
            iconClassName: 'text-white',
            iconCircleClass: `bg-${options.color}`,
        };
    } else {
        return {
            IconComponent: BrokenLink,
            title: key,
            plural: `${key}s`,
            type: key,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
        };
    }
};

export const getConsentFlowLinkForContract = (contract: ConsentFlowContractDetails) => {
    const baseUrl = getBaseUrl();
    const isLocalhost = baseUrl.includes('localhost');
    return `http${isLocalhost ? '' : 's'}://${baseUrl}/consent-flow?uri=${contract.uri}`;
};

export const getContractTermsInfo = (contract: ConsentFlowContractDetails) => {
    const readTerms = contract.contract.read;
    const writeTerms = contract.contract.write;

    return {
        requestingRead:
            Object.keys(readTerms.personal).length > 0 ||
            Object.keys(readTerms.credentials.categories).length > 0,
        requestingWrite:
            Object.keys(writeTerms.personal).length > 0 ||
            Object.keys(writeTerms.credentials.categories).length > 0,
    };
};
