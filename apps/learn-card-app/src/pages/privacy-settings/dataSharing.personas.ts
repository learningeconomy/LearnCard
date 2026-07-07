import { AllowConnectionRequestsEnum, ProfileVisibilityEnum } from '@learncard/types';

import type { ConsentedContract } from '../../components/data-sharing/consentSummary';
import type {
    DataSharingCenterViewModel,
    DataSharingDiagnosticsViewModel,
    DataSharingProfileViewModel,
} from './DataSharingCenter.types';

const noop = () => undefined;
const noopToggle = async () => true;

const logo = (seed: string, bg: string) =>
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        seed
    )}&backgroundColor=${bg}`;

const makeContract = (opts: {
    uri: string;
    name: string;
    image?: string;
    read?: string[];
    write?: string[];
}): ConsentedContract => {
    const readCategories = Object.fromEntries((opts.read ?? []).map(c => [c, { sharing: true }]));
    const writeCategories = Object.fromEntries((opts.write ?? []).map(c => [c, true]));

    return {
        uri: opts.uri,
        status: 'live',
        terms: {
            read: { credentials: { categories: readCategories }, personal: {} },
            write: { credentials: { categories: writeCategories }, personal: {} },
        },
        contract: {
            uri: opts.uri,
            name: opts.name,
            image: opts.image,
        },
    } as unknown as ConsentedContract;
};

const FEW_CONTRACTS: ConsentedContract[] = [
    makeContract({
        uri: 'contract:learncard-ai',
        name: 'LearnCard AI',
        image: logo('LearnCard AI', '4F46E5'),
        read: ['Achievement', 'ID', 'Course', 'Skill'],
        write: ['Achievement', 'Skill'],
    }),
    makeContract({
        uri: 'contract:state-university',
        name: 'State University',
        image: logo('State University', '0B6E4F'),
        write: ['Achievement', 'Course'],
    }),
    makeContract({
        uri: 'contract:acme',
        name: 'Acme Careers',
        image: logo('Acme Careers', '18224E'),
        read: ['ID', 'Achievement'],
    }),
];

const MANY_CONTRACTS: ConsentedContract[] = [
    makeContract({
        uri: 'contract:learncard-ai',
        name: 'LearnCard AI',
        image: logo('LearnCard AI', '4F46E5'),
        read: ['Achievement', 'ID', 'Course', 'Skill'],
        write: ['Achievement', 'Skill'],
    }),
    makeContract({
        uri: 'contract:chatgpt',
        name: 'ChatGPT',
        image: logo('ChatGPT', '10A37F'),
        read: ['Achievement', 'Skill'],
        write: ['Skill'],
    }),
    makeContract({
        uri: 'contract:claude',
        name: 'Claude Assistant',
        image: logo('Claude', 'D97757'),
        read: ['Achievement'],
        write: ['Achievement'],
    }),
    makeContract({
        uri: 'contract:state-university',
        name: 'State University',
        image: logo('State University', '0B6E4F'),
        write: ['Achievement', 'Course'],
    }),
    makeContract({
        uri: 'contract:hill-valley-high-school',
        name: 'Hill Valley High School',
        image: logo('Hill Valley', 'C81E1E'),
        write: ['Achievement'],
    }),
    makeContract({
        uri: 'contract:acme',
        name: 'Acme Careers',
        image: logo('Acme Careers', '18224E'),
        read: ['ID', 'Achievement'],
    }),
    makeContract({
        uri: 'contract:taylorbot',
        name: 'TaylorBot Dashboard',
        image: logo('TaylorBot', '1F6FEB'),
        read: ['ID'],
    }),
    makeContract({
        uri: 'contract:jobmatch',
        name: 'JobMatch',
        image: logo('JobMatch', '7C3AED'),
        read: ['Achievement', 'Skill', 'ID'],
        write: ['Skill'],
    }),
    makeContract({
        uri: 'contract:portfolio',
        name: 'Portfolio Builder',
        image: logo('Portfolio', 'DB2777'),
        read: ['Achievement'],
    }),
];

const baseProfile: DataSharingProfileViewModel = {
    brandName: 'LearnCard',
    visibility: ProfileVisibilityEnum.enum.public,
    showEmail: false,
    allowConnectionRequests: AllowConnectionRequestsEnum.enum.anyone,
    savingField: null,
    onChangeVisibility: noop,
    onToggleShowEmail: noop,
    onChangeConnectionRequests: noop,
};

const baseDiagnostics: DataSharingDiagnosticsViewModel = {
    brandName: 'LearnCard',
    analyticsEnabled: true,
    bugReportsEnabled: true,
    onToggleAnalytics: noop,
    onToggleBugReports: noop,
};

const baseAi = {
    checked: true,
    disabled: false,
    showConsentWarning: false,
    onToggle: noopToggle,
    onRetryConsent: noopToggle,
};

export const DATA_SHARING_PERSONAS: Record<string, DataSharingCenterViewModel> = {
    'Active learner': {
        isLoading: false,
        isMinor: false,
        contracts: FEW_CONTRACTS,
        onContractsUpdate: noop,
        ai: baseAi,
        profile: baseProfile,
        diagnostics: baseDiagnostics,
    },
    'Nothing shared': {
        isLoading: false,
        isMinor: false,
        contracts: [],
        onContractsUpdate: noop,
        ai: { ...baseAi, checked: false },
        profile: baseProfile,
        diagnostics: baseDiagnostics,
    },
    'Many apps · grouped': {
        isLoading: false,
        isMinor: false,
        contracts: MANY_CONTRACTS,
        onContractsUpdate: noop,
        ai: baseAi,
        profile: { ...baseProfile, visibility: ProfileVisibilityEnum.enum.connections_only },
        diagnostics: baseDiagnostics,
    },
    'AI consent needs repair': {
        isLoading: false,
        isMinor: false,
        contracts: FEW_CONTRACTS,
        onContractsUpdate: noop,
        ai: { ...baseAi, showConsentWarning: true },
        profile: baseProfile,
        diagnostics: baseDiagnostics,
    },
    Minor: {
        isLoading: false,
        isMinor: true,
        contracts: FEW_CONTRACTS,
        onContractsUpdate: noop,
        ai: null,
        profile: baseProfile,
        diagnostics: { ...baseDiagnostics, analyticsEnabled: false, bugReportsEnabled: false },
    },
    Loading: {
        isLoading: true,
        isMinor: false,
        contracts: [],
        onContractsUpdate: noop,
        ai: baseAi,
        profile: baseProfile,
        diagnostics: baseDiagnostics,
    },
};
