import React, { useMemo } from 'react';

import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';

const ResumePreviewUserInfo: React.FC = () => {
    const personalDetails = resumeBuilderStore.useTracked.personalDetails();

    const name = personalDetails.name;
    const email = personalDetails.email;
    const phone = personalDetails.phone;
    const location = personalDetails.location;
    const summary = personalDetails.summary;

    const hasPersonalInfo = useMemo(() => {
        return Object.values(personalDetails).some(v => v.trim());
    }, [personalDetails]);

    if (!hasPersonalInfo) return null;

    return (
        <>
            {hasPersonalInfo && (
                <div className="border-b border-grayscale-200 pb-6 mb-6">
                    {name && (
                        <h1 className="text-3xl font-bold text-grayscale-900 tracking-tight">
                            {name}
                        </h1>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-grayscale-600">
                        {email && <span>{email}</span>}
                        {phone && <span>{phone}</span>}
                        {location && <span>{location}</span>}
                    </div>
                    {summary && (
                        <p className="mt-3 text-sm text-grayscale-700 leading-relaxed">{summary}</p>
                    )}
                </div>
            )}
        </>
    );
};

export default ResumePreviewUserInfo;
