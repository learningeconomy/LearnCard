import React, { useState } from 'react';

import { FlatIcon } from './ClrStatCard';
import ClrIssuerBadge from './ClrIssuerBadge';
import CredentialVerificationDisplay from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import { ChevronDown, ChevronUp, Paperclip } from 'lucide-react';
import { SkillsIcon } from 'learn-card-base/svgs/wallet/SkillsIcon';

import type { VC } from '@learncard/types';
import type { CourseDisplayModel } from '../../helpers/clrRenderer.helpers';
import { formatClrDate } from '../../helpers/clrRenderer.helpers';

const ClrCourseCredentialCollapsible: React.FC<{
    course: CourseDisplayModel;
    issuerName?: string;
    issuerLogo?: string;
    skillCount?: number;
    credential?: VC;
}> = ({ course, issuerName, issuerLogo, skillCount = 0, credential }) => {
    const [open, setOpen] = useState(true);
    const evidenceCount = course.evidence.length;
    const hasFooter = Boolean(
        credential || course.earnedAt?.value || skillCount > 0 || evidenceCount > 0
    );

    return (
        <div className="bg-white shadow-box-bottom rounded-2xl overflow-hidden w-full">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3.5"
            >
                <p className="text-sm font-semibold text-grayscale-900">1 Credential</p>
                <span className="text-grayscale-600 text-xs">
                    {open ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </span>
            </button>

            {open && (
                <div className="px-4 pb-4 w-full">
                    <div className="w-full bg-white border border-grayscale-200 rounded-[20px] py-2 pr-4 pl-2 flex items-center gap-2">
                        <div className="shrink-0">
                            <ClrIssuerBadge
                                variant="standard"
                                logoSrc={issuerLogo}
                                issuerName={issuerName}
                                size={80}
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="">
                                <p className="text-sm font-semibold text-grayscale-900 truncate">
                                    {course.name?.value ?? 'Course'}
                                </p>
                                <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide truncate">
                                    {course.achievementType.value}
                                    {course.fieldOfStudy?.value &&
                                        ` • ${course.fieldOfStudy.value}`}
                                </p>
                                {issuerName && (
                                    <p className="text-sm text-grayscale-800 truncate">
                                        By <span className="font-semibold">{issuerName}</span>
                                    </p>
                                )}
                            </div>

                            {hasFooter && (
                                <div className="mt-2 pt-1 border-t border-grayscale-200 flex flex-wrap items-center justify-between gap-3">
                                    {(credential || course.earnedAt?.value) && (
                                        <p className="flex items-center gap-1.5 text-sm font-semibold text-grayscale-600 min-w-0">
                                            {credential && (
                                                <CredentialVerificationDisplay
                                                    credential={credential}
                                                    iconClassName="!w-5 !h-5"
                                                />
                                            )}
                                            {course.earnedAt?.value && (
                                                <span className="truncate">
                                                    Issued {formatClrDate(course.earnedAt.value)}
                                                </span>
                                            )}
                                        </p>
                                    )}

                                    <div className="ml-auto flex items-center gap-4">
                                        {skillCount > 0 && (
                                            <span className="flex items-center gap-1.5 text-sm font-semibold text-grayscale-600">
                                                <FlatIcon>
                                                    <SkillsIcon className="w-5 h-5 text-grayscale-500" />
                                                </FlatIcon>
                                                {skillCount}
                                            </span>
                                        )}
                                        {evidenceCount > 0 && (
                                            <span className="flex items-center gap-1.5 text-sm font-semibold text-grayscale-600">
                                                <Paperclip
                                                    size={19}
                                                    className="text-grayscale-500"
                                                />
                                                {evidenceCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClrCourseCredentialCollapsible;
