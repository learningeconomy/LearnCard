import {
    ConsentFlowContract,
    ConsentFlowContractDetails,
    ConsentFlowTerms,
} from '@learncard/types';
import BrokenLink from '../components/svgs/BrokenLink';
import {
    BoostCategoryOptionsEnum,
    CredentialCategoryEnum,
    CurrentUser,
    LaunchPadAppListItem,
    boostCategoryMetadata,
    categoryMetadata,
    getBaseUrl,
} from 'learn-card-base';
import { walletPageData } from '../pages/wallet/constants';
import { getAiAppBackgroundStylesForApp } from '../components/ai-passport-apps/aiPassport-apps.helpers';

// Note: The actual value used in contracts needs to be categoryMetadata[category].contractCredentialTypeOverride
const AI_CONTRACT_CATEGORIES = [
    CredentialCategoryEnum.aiSummary,
    CredentialCategoryEnum.aiTopic,
    CredentialCategoryEnum.aiAssessment,
    CredentialCategoryEnum.aiInsight,
    CredentialCategoryEnum.aiPathway,
];

export const AI_CONTRACT_CREDENTIAL_TYPE_OVERRIDES: string[] = AI_CONTRACT_CATEGORIES.map(
    category => {
        return categoryMetadata[category].contractCredentialTypeOverride || category;
    }
);

export const CONTRACT_CATEGORIES: (CredentialCategoryEnum | string)[] = [
    CredentialCategoryEnum.socialBadge,
    CredentialCategoryEnum.achievement,
    CredentialCategoryEnum.learningHistory,
    CredentialCategoryEnum.accomplishment,
    CredentialCategoryEnum.accommodation,
    CredentialCategoryEnum.workHistory,
    CredentialCategoryEnum.id,

    ...AI_CONTRACT_CREDENTIAL_TYPE_OVERRIDES,
];

export const contractAnonImageSrc = 'https://cdn.filestackcontent.com/52hRlXLIQVBi4fYpB1xw';

export const getPersonalEntry = (key: string, user?: CurrentUser | null, anonymize = true) => {
    if (key.toLowerCase() === 'name') return anonymize ? 'Anonymous' : user?.name ?? '';
    if (key.toLowerCase() === 'email')
        return anonymize ? 'anonymous@hidden.com' : user?.email ?? '';
    if (key.toLowerCase() === 'image') {
        return anonymize ? contractAnonImageSrc : user?.profileImage ?? '';
    }

    return '';
};

export const isSupportedPersonalField = (field: string) => {
    const lowerField = field.toLowerCase();
    return ['name', 'email', 'image'].includes(lowerField);
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
        // Use defaultEnabled flag to determine if field should be enabled by default
        const shouldEnable = value.required || (value.defaultEnabled ?? false);
        terms.read.personal[key] = shouldEnable
            ? getPersonalEntry(key, user, contract.read.anonymize ?? true)
            : '';
    });
    contractPersonalWriteEntries.forEach(([key, value]) => {
        // Use defaultEnabled flag to determine if field should be enabled by default
        terms.write.personal[key] = value.required || (value.defaultEnabled ?? false);
    });
    contractCategoryReadEntries.forEach(([key, value]) => {
        // Use defaultEnabled flag to determine if category should be enabled by default
        const shouldEnable = value.required || (value.defaultEnabled ?? false);
        terms.read.credentials.categories[key] = {
            shareAll: shouldEnable,
            sharing: shouldEnable,
            shared: [],
        };
    });
    contractCategoryWriteEntries.forEach(([key, value]) => {
        // Use defaultEnabled flag to determine if category should be enabled by default
        terms.write.credentials.categories[key] = value.required || (value.defaultEnabled ?? false);
    });

    return terms;
};

export const getInfoFromContractKey = (key: string) => {
    const options = boostCategoryMetadata[key as BoostCategoryOptionsEnum];

    // prefer the wallet title + icon
    const walletOptions = walletPageData.find(data => {
        const normalizedKey = key.toLowerCase().replaceAll(' ', '');
        const normalizedOptionTitle = options?.title.toLowerCase();

        const normalizedWalletDataSubtype = data.subtype.endsWith('s')
            ? data.subtype.toLowerCase().slice(0, -1)
            : data.subtype.toLowerCase();
        const normalizedWalletDataTitle = data.title.endsWith('s')
            ? data.title.toLowerCase().slice(0, -1)
            : data.title.toLowerCase();

        return (
            normalizedWalletDataSubtype === normalizedKey ||
            normalizedWalletDataTitle === normalizedOptionTitle ||
            (normalizedKey === 'family' && data.title === 'Families') ||
            (normalizedKey === 'workhistory' && data.title === 'Experiences') ||
            (normalizedKey === 'membership' && data.title === 'IDs') ||
            (normalizedKey === 'course' && data.title === 'Studies')
        );
    });

    if (options) {
        return {
            IconComponent: options.IconComponent,
            iconSrc: walletOptions?.iconSrc,
            title: walletOptions?.title ?? options.title,
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

export const getPrivacyAndDataInfo = (
    contractDetails: ConsentFlowContractDetails,
    app?: LaunchPadAppListItem
) => {
    const { name: contractName, image: contractImage } = contractDetails ?? {};
    const { name: appName, img: appImage } = app ?? {};
    const name = appName ?? contractName;
    const image = appImage ?? contractImage;

    const appStyles = app ? getAiAppBackgroundStylesForApp(app) : { backgroundColor: '#18224E' };

    return { name, image, appStyles };
};
