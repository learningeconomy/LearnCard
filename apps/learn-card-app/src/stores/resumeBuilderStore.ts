import { createStore } from '@udecode/zustood';
import { v4 as uuidv4 } from 'uuid';
import { CredentialCategoryEnum } from 'learn-card-base';

import {
    PersonalDetails,
    RESUME_SECTIONS,
    ResumeSectionKey,
    CredentialEntry,
    ResumeFieldEntry,
    ResumeFieldType,
    ResumeFieldSource,
} from '../components/resume-builder/resume-builder.helpers';

export type ResumeBuilderState = {
    personalDetails: PersonalDetails;
    hiddenPersonalDetails: Partial<Record<keyof PersonalDetails, boolean>>;
    currentJobCredentialUri: string | null;
    workExperienceEndDates: Record<string, string>;
    documentSetup: {
        showQRCode: boolean;
        fileName: string;
    };
    credentialEntries: Partial<Record<ResumeSectionKey, CredentialEntry[]>>;
    sectionOrder: ResumeSectionKey[];
};

const defaultPersonalDetails: PersonalDetails = {
    name: '',
    career: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    website: '',
    linkedIn: '',
    thumbnail: '',
};

const defaultSectionOrder = RESUME_SECTIONS.map(s => s.key) as ResumeSectionKey[];
const defaultDocumentSetup = {
    showQRCode: true,
    fileName: 'resume.pdf',
};

const makeFieldId = () => uuidv4();

const getEntries = (section: ResumeSectionKey): CredentialEntry[] =>
    resumeBuilderStore.get.credentialEntries()[section] ?? [];

const setEntries = (set: any, section: ResumeSectionKey, entries: CredentialEntry[]) => {
    const prev = resumeBuilderStore.get.credentialEntries();
    set.credentialEntries({ ...prev, [section]: entries });
};

export const resumeBuilderStore = createStore('resumeBuilderStore')<ResumeBuilderState>(
    {
        personalDetails: defaultPersonalDetails,
        hiddenPersonalDetails: {},
        currentJobCredentialUri: null,
        workExperienceEndDates: {},
        documentSetup: defaultDocumentSetup,
        sectionOrder: defaultSectionOrder,
        credentialEntries: {},
    },
    { persist: { name: 'resumeBuilderStore', enabled: true } }
).extendActions(set => ({
    setPersonalDetails: (details: Partial<PersonalDetails>) => {
        const prev = resumeBuilderStore.get.personalDetails();
        set.personalDetails({ ...prev, ...details });
    },
    setPersonalDetailHidden: (key: keyof PersonalDetails, hidden: boolean) => {
        const prev = resumeBuilderStore.get.hiddenPersonalDetails();
        if (hidden) {
            set.hiddenPersonalDetails({ ...prev, [key]: true });
            return;
        }

        const next = { ...prev };
        delete next[key];
        set.hiddenPersonalDetails(next);
    },
    togglePersonalDetailHidden: (key: keyof PersonalDetails) => {
        const prev = resumeBuilderStore.get.hiddenPersonalDetails();
        const isHidden = Boolean(prev?.[key]);
        if (!isHidden) {
            set.hiddenPersonalDetails({ ...prev, [key]: true });
            return;
        }

        const next = { ...prev };
        delete next[key];
        set.hiddenPersonalDetails(next);
    },
    setDocumentSetup: (
        setup: Partial<{
            showQRCode: boolean;
            fileName: string;
        }>
    ) => {
        const prev = resumeBuilderStore.get.documentSetup();
        set.documentSetup({ ...prev, ...setup });
    },
    setCurrentJobCredentialUri: (uri: string | null) => {
        set.currentJobCredentialUri(uri);
    },
    setWorkExperienceEndDate: (uri: string, date: string) => {
        const prev = resumeBuilderStore.get.workExperienceEndDates();
        if (!date) {
            const next = { ...prev };
            delete next[uri];
            set.workExperienceEndDates(next);
            return;
        }

        set.workExperienceEndDates({ ...prev, [uri]: date });
    },

    // ── Credential selection & ordering ─────────────────────────────────────
    toggleCredential: (section: ResumeSectionKey, uri: string) => {
        const entries = getEntries(section);
        const exists = entries.some(e => e.uri === uri);
        if (exists) {
            const removed = entries.filter(e => e.uri !== uri).map((e, i) => ({ ...e, index: i }));
            setEntries(set, section, removed);
            if (
                section === CredentialCategoryEnum.workHistory &&
                resumeBuilderStore.get.currentJobCredentialUri() === uri
            ) {
                set.currentJobCredentialUri(null);
            }
            if (section === CredentialCategoryEnum.workHistory) {
                const prevEndDates = resumeBuilderStore.get.workExperienceEndDates();
                if (prevEndDates[uri]) {
                    const nextEndDates = { ...prevEndDates };
                    delete nextEndDates[uri];
                    set.workExperienceEndDates(nextEndDates);
                }
            }
        } else {
            const added: CredentialEntry = { uri, index: entries.length, fields: [] };
            setEntries(set, section, [...entries, added]);
        }
    },

    reorderCredentials: (section: ResumeSectionKey, orderedUris: string[]) => {
        const entries = getEntries(section);
        const byUri = Object.fromEntries(entries.map(e => [e.uri, e]));
        const reordered = orderedUris
            .filter(uri => byUri[uri])
            .map((uri, i) => ({ ...byUri[uri], index: i }));
        setEntries(set, section, reordered);
    },

    // ── Field initialisation (call when VC resolves, if fields not yet set) ─
    initCredentialFields: (
        uri: string,
        section: ResumeSectionKey,
        initialFields: Omit<ResumeFieldEntry, 'id' | 'index'>[]
    ) => {
        const entries = getEntries(section);
        const entryIdx = entries.findIndex(e => e.uri === uri);
        if (entryIdx === -1) return;
        if (entries[entryIdx].fields.length > 0) return;
        const fields: ResumeFieldEntry[] = initialFields.map((f, i) => ({
            ...f,
            id: makeFieldId(),
            index: i,
        }));
        const updated = entries.map((e, i) => (i === entryIdx ? { ...e, fields } : e));
        setEntries(set, section, updated);
    },

    // ── Field CRUD & ordering ───────────────────────────────────────────────
    addCredentialField: (
        uri: string,
        section: ResumeSectionKey,
        value: string,
        source: ResumeFieldSource,
        type: ResumeFieldType
    ) => {
        const entries = getEntries(section);
        const entryIdx = entries.findIndex(e => e.uri === uri);
        if (entryIdx === -1) return;
        const fields = entries[entryIdx].fields;
        const newField: ResumeFieldEntry = {
            id: makeFieldId(),
            value,
            source,
            type,
            index: fields.length,
        };
        const updated = entries.map((e, i) =>
            i === entryIdx ? { ...e, fields: [...e.fields, newField] } : e
        );
        setEntries(set, section, updated);
    },

    updateCredentialField: (
        uri: string,
        section: ResumeSectionKey,
        fieldId: string,
        value: string,
        source: ResumeFieldSource
    ) => {
        const entries = getEntries(section);
        const entryIdx = entries.findIndex(e => e.uri === uri);
        if (entryIdx === -1) return;
        const fields = entries[entryIdx].fields.map(f =>
            f.id === fieldId ? { ...f, value, source } : f
        );
        const updated = entries.map((e, i) => (i === entryIdx ? { ...e, fields } : e));
        setEntries(set, section, updated);
    },

    removeCredentialField: (uri: string, section: ResumeSectionKey, fieldId: string) => {
        const entries = getEntries(section);
        const entryIdx = entries.findIndex(e => e.uri === uri);
        if (entryIdx === -1) return;
        const fields = entries[entryIdx].fields
            .filter(f => f.id !== fieldId)
            .map((f, i) => ({ ...f, index: i }));
        const updated = entries.map((e, i) => (i === entryIdx ? { ...e, fields } : e));
        setEntries(set, section, updated);
    },

    reorderCredentialFields: (uri: string, section: ResumeSectionKey, orderedIds: string[]) => {
        const entries = getEntries(section);
        const entryIdx = entries.findIndex(e => e.uri === uri);
        if (entryIdx === -1) return;
        const byId = Object.fromEntries(entries[entryIdx].fields.map(f => [f.id, f]));
        const fields = orderedIds
            .filter(id => byId[id])
            .map((id, i) => ({ ...byId[id], index: i }));
        const updated = entries.map((e, i) => (i === entryIdx ? { ...e, fields } : e));
        setEntries(set, section, updated);
    },

    // ── Section ordering ────────────────────────────────────────────────────
    setSectionOrder: (order: ResumeSectionKey[]) => {
        set.sectionOrder(order);
    },

    // ── Reset ───────────────────────────────────────────────────────────────
    resetStore: () => {
        set.personalDetails(defaultPersonalDetails);
        set.hiddenPersonalDetails({});
        set.currentJobCredentialUri(null);
        set.workExperienceEndDates({});
        set.documentSetup(defaultDocumentSetup);
        set.credentialEntries({});
        set.sectionOrder(defaultSectionOrder);
    },
}));
