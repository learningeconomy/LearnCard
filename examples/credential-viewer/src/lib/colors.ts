import type { CredentialSpec, CredentialProfile, FixtureValidity } from '@learncard/credential-library';

export const SPEC_COLORS: Record<CredentialSpec, { bg: string; text: string; border: string }> = {
    'vc-v1': { bg: 'bg-blue-900/40', text: 'text-blue-300', border: 'border-blue-700' },
    'vc-v2': { bg: 'bg-blue-900/60', text: 'text-blue-200', border: 'border-blue-600' },
    'obv3': { bg: 'bg-emerald-900/50', text: 'text-emerald-300', border: 'border-emerald-700' },
    'clr-v2': { bg: 'bg-purple-900/50', text: 'text-purple-300', border: 'border-purple-700' },
    'europass': { bg: 'bg-amber-900/50', text: 'text-amber-300', border: 'border-amber-700' },
    'custom': { bg: 'bg-gray-800/50', text: 'text-gray-300', border: 'border-gray-600' },
};

export const SPEC_LABELS: Record<CredentialSpec, string> = {
    'vc-v1': 'VC v1',
    'vc-v2': 'VC v2',
    'obv3': 'OBv3',
    'clr-v2': 'CLR v2',
    'europass': 'Europass',
    'custom': 'Custom',
};

export const PROFILE_LABELS: Record<CredentialProfile, string> = {
    'badge': 'Badge',
    'diploma': 'Diploma',
    'certificate': 'Certificate',
    'id': 'ID',
    'membership': 'Membership',
    'license': 'License',
    'micro-credential': 'Micro-credential',
    'course': 'Course',
    'degree': 'Degree',
    'boost': 'Boost',
    'boost-id': 'Boost ID',
    'delegate': 'Delegate',
    'endorsement': 'Endorsement',
    'learner-record': 'Learner Record',
    'generic': 'Generic',
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    'Achievement': { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    'ID': { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    'Learning History': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    'Work History': { bg: 'bg-orange-500/10', text: 'text-orange-400' },
    'Social Badge': { bg: 'bg-pink-500/10', text: 'text-pink-400' },
    'Membership': { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
};

export const DEFAULT_CATEGORY_COLOR = { bg: 'bg-gray-500/10', text: 'text-gray-400' };

export const VALIDITY_COLORS: Record<FixtureValidity, { bg: string; text: string }> = {
    'valid': { bg: 'bg-green-900/50', text: 'text-green-400' },
    'invalid': { bg: 'bg-red-900/50', text: 'text-red-400' },
    'tampered': { bg: 'bg-orange-900/50', text: 'text-orange-400' },
};
