import { createStore } from '@udecode/zustood';

import {
    PersonalDetails,
    RESUME_SECTIONS,
    ResumeSectionKey,
    ResolvedCredentialMeta,
    ResumeField,
    ResumeSelfAttestedFields,
} from '../components/resume-builder/resume-builder.helpers';

export type ResumeBuilderState = {
    personalDetails: PersonalDetails;
    selectedCredentialUris: Partial<Record<ResumeSectionKey, string[]>>;
    resolvedCredentials: Record<string, ResolvedCredentialMeta>;
    sectionOrder: ResumeSectionKey[];
    selfAttested: Record<string, ResumeSelfAttestedFields>;
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
        selfAttested: {},
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
    setSelfAttestedDescription: (uri: string, field: ResumeField) => {
        const prev = resumeBuilderStore.get.selfAttested();
        const existing = prev[uri] ?? { additionalDetails: [] };
        set.selfAttested({ ...prev, [uri]: { ...existing, description: field } });
    },
    addSelfAttestedDetail: (uri: string, field: ResumeField) => {
        const prev = resumeBuilderStore.get.selfAttested();
        const existing = prev[uri] ?? { additionalDetails: [] };
        set.selfAttested({
            ...prev,
            [uri]: { ...existing, additionalDetails: [...existing.additionalDetails, field] },
        });
    },
    updateSelfAttestedDetail: (uri: string, index: number, field: ResumeField) => {
        const prev = resumeBuilderStore.get.selfAttested();
        const existing = prev[uri] ?? { additionalDetails: [] };
        const updated = existing.additionalDetails.map((d, i) => (i === index ? field : d));
        set.selfAttested({ ...prev, [uri]: { ...existing, additionalDetails: updated } });
    },
    removeSelfAttestedDetail: (uri: string, index: number) => {
        const prev = resumeBuilderStore.get.selfAttested();
        const existing = prev[uri] ?? { additionalDetails: [] };
        const updated = existing.additionalDetails.filter((_, i) => i !== index);
        set.selfAttested({ ...prev, [uri]: { ...existing, additionalDetails: updated } });
    },
    reorderSelfAttestedDetails: (uri: string, from: number, to: number) => {
        const prev = resumeBuilderStore.get.selfAttested();
        const existing = prev[uri] ?? { additionalDetails: [] };
        const reordered = [...existing.additionalDetails];
        const [moved] = reordered.splice(from, 1);
        reordered.splice(to, 0, moved);
        set.selfAttested({ ...prev, [uri]: { ...existing, additionalDetails: reordered } });
    },
    reorderAllSelfAttestedFields: (uri: string, reorderedFields: ResumeField[]) => {
        const prev = resumeBuilderStore.get.selfAttested();
        const existing = prev[uri] ?? { additionalDetails: [] };
        const [first, ...rest] = reorderedFields;
        set.selfAttested({
            ...prev,
            [uri]: { ...existing, description: first, additionalDetails: rest },
        });
    },
    resetStore: () => {
        set.personalDetails(defaultPersonalDetails);
        set.selectedCredentialUris({});
        set.resolvedCredentials({});
        set.sectionOrder(defaultSectionOrder);
        set.selfAttested({});
    },
}));
