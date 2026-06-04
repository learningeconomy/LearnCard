import React from 'react';

import { CertificateDisplayIcon, CourseDisplayIcon } from 'learn-card-base';
import Graduation from 'learn-card-base/svgs/Graduation';

export type ClrBadgeKind = 'transcript' | 'course' | 'degree';

type CredentialCLRBadgePillProps = {
    kind: ClrBadgeKind;
};

const CredentialCLRBadgePill: React.FC<CredentialCLRBadgePillProps> = ({ kind }) => {
    const config = {
        transcript: {
            label: 'Transcript',
            Icon: Graduation,
        },
        course: {
            label: 'Course',
            Icon: CourseDisplayIcon,
        },
        degree: {
            label: 'Degree',
            Icon: CertificateDisplayIcon,
        },
    }[kind];

    const Icon = config.Icon;

    return (
        <div className="absolute bottom-[-10px] left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1.5 rounded-full border-[2px] border-solid border-white bg-grayscale-100 px-3 py-1.5">
            <Icon className="h-4 w-4 text-grayscale-700" />
            <span className="text-xs font-semibold uppercase text-grayscale-700">
                {config.label}
            </span>
        </div>
    );
};

export default CredentialCLRBadgePill;
