import { createStore } from '@udecode/zustood';

import {
    PersonalDetails,
    RESUME_SECTIONS,
    ResumeSectionKey,
    ResolvedCredentialMeta,
} from '../components/resume-builder/resume-builder.helpers';

export type ResumeBuilderState = {
    personalDetails: PersonalDetails;
    selectedCredentialUris: Partial<Record<ResumeSectionKey, string[]>>;
    resolvedCredentials: Record<string, ResolvedCredentialMeta>;
    sectionOrder: ResumeSectionKey[];
};

const defaultPersonalDetails: PersonalDetails = {
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
};

const defaultSectionOrder = RESUME_SECTIONS.map(s => s.key) as ResumeSectionKey[];

export const resumeBuilderStore = createStore('resumeBuilderStore')<ResumeBuilderState>(
    {
        personalDetails: defaultPersonalDetails,
        selectedCredentialUris: {},
        resolvedCredentials: {},
        sectionOrder: defaultSectionOrder,
    },
    { persist: { name: 'resumeBuilderStore', enabled: true } }
).extendActions(set => ({
    setPersonalDetails: (details: Partial<PersonalDetails>) => {
        const prev = resumeBuilderStore.get.personalDetails();
        set.personalDetails({ ...prev, ...details });
    },
    toggleCredential: (section: ResumeSectionKey, uri: string) => {
        const prev = resumeBuilderStore.get.selectedCredentialUris();
        const current = prev[section] ?? [];
        const next = current.includes(uri) ? current.filter(u => u !== uri) : [...current, uri];
        set.selectedCredentialUris({ ...prev, [section]: next });
    },
    setResolvedCredential: (uri: string, meta: ResolvedCredentialMeta) => {
        const prev = resumeBuilderStore.get.resolvedCredentials();
        set.resolvedCredentials({ ...prev, [uri]: meta });
    },
    setSectionOrder: (order: ResumeSectionKey[]) => {
        set.sectionOrder(order);
    },
    resetStore: () => {
        set.personalDetails(defaultPersonalDetails);
        set.selectedCredentialUris({});
        set.resolvedCredentials({});
        set.sectionOrder(defaultSectionOrder);
    },
}));
