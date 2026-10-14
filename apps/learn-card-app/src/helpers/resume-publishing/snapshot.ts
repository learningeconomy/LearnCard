import type { ResumeBuilderSnapshot } from '../../stores/resumeBuilderStore';

/** Only the fields visible in the captured document may populate its LER contact details. */
export const visibleResumeContact = (snapshot: ResumeBuilderSnapshot) => {
    const visible = (field: `${keyof typeof snapshot.personalDetails}`): string | undefined =>
        snapshot.hiddenPersonalDetails[field]
            ? undefined
            : snapshot.personalDetails[field]?.trim() || undefined;
    return {
        fullName: visible('name') || '',
        email: visible('email'),
        phone: visible('phone'),
        location: visible('location'),
        career: visible('career'),
        summary: visible('summary'),
        website: visible('website'),
        linkedIn: visible('linkedIn'),
    };
};
