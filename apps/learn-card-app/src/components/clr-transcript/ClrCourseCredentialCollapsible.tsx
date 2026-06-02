import { useState } from 'react';

import { FlatIcon } from './ClrStatCard';
import ClrIssuerBadge from './ClrIssuerBadge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { StudiesIcon } from 'learn-card-base/svgs/wallet/StudiesIcon';

import type { CourseDisplayModel } from '../../helpers/clrRenderer.helpers';
import { formatClrDate } from '../../helpers/clrRenderer.helpers';

type Props = {
    course: CourseDisplayModel;
    issuerName?: string;
};

const ClrCourseCredentialCollapsible = ({ course, issuerName }: Props) => {
    const [open, setOpen] = useState(true);

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
                <div className="pb-4 w-full">
                    <div className="w-full bg-white flex items-center gap-3 pl-[50px] pr-4 relative">
                        <div className="absolute left-[10px]">
                            <ClrIssuerBadge variant="standard" issuerName={issuerName} size={80} />
                        </div>
                        <div className="min-w-0 space-y-0.5 pr-2 pl-[50px] py-2 rounded-[15px] shadow-box-bottom w-full relative">
                            <p className="text-sm font-medium text-grayscale-900 truncate">
                                {course.name?.value ?? 'Course'}
                            </p>
                            <p className="text-xs font-medium text-grayscale-600 uppercase truncate">
                                {course.achievementType.value}
                                {course.fieldOfStudy?.value && ` · ${course.fieldOfStudy.value}`}
                            </p>

                            {issuerName && (
                                <p className="flex items-center gap-1 text-xs text-grayscale-800 min-w-0">
                                    <FlatIcon>
                                        <StudiesIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                                    </FlatIcon>
                                    <span className="truncate">
                                        · By <span className="font-semibold">{issuerName}</span>
                                    </span>
                                </p>
                            )}

                            {course.earnedAt?.value && (
                                <p className="text-xs text-grayscale-600 truncate !mt-2">
                                    {formatClrDate(course.earnedAt.value)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClrCourseCredentialCollapsible;
