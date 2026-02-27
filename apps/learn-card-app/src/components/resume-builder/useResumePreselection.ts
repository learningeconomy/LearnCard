import { useEffect, useRef } from 'react';

import { useGetCredentialList } from 'learn-card-base';
import { RESUME_SECTIONS, ResumeSectionKey } from './resume-builder.helpers';
import { resumeBuilderStore } from '../../stores/resumeBuilderStore';

function useSectionPreselection(sectionKey: ResumeSectionKey) {
    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();
    const toggleCredential = resumeBuilderStore.set.toggleCredential;
    const selected = (credentialEntries[sectionKey] ?? []).map(e => e.uri);

    const { data: credentialPages, isLoading } = useGetCredentialList(sectionKey as any);

    const records = credentialPages?.pages?.flatMap(page => page?.records ?? []) ?? [];

    const preselected = useRef(false);
    useEffect(() => {
        if (preselected.current) return;
        if (isLoading || records.length === 0) return;
        if (selected.length > 0) {
            preselected.current = true;
            return;
        }
        records.slice(0, 2).forEach(record => toggleCredential(sectionKey, record.uri));
        preselected.current = true;
    }, [isLoading, records]);
}

export function useResumePreselection() {
    useSectionPreselection(RESUME_SECTIONS[0].key);
    useSectionPreselection(RESUME_SECTIONS[1].key);
}
