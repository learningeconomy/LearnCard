import React from 'react';

import GearPlusIcon from 'learn-card-base/svgs/GearPlusIcon';

import { useTheme } from '../../../theme/hooks/useTheme';
import { useModal, ModalTypes } from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import { RESUME_SECTIONS, ResumeSectionKey } from '../resume-builder.helpers';
import { getEmptySectionCopy } from '../resumeBuilderI18n';
import ResumeSelfAttestModal from '../ResumeSelfAttestModal';

import * as m from '../../../paraglide/messages.js';

export const ResumePreviewSectionPlaceholder: React.FC<{
    category: ResumeSectionKey;
    className?: string;
}> = ({ category, className = '' }) => {
    const { getThemedCategory } = useTheme();
    const { newModal } = useModal();
    const brandingConfig = useBrandingConfig();
    const brandingName = brandingConfig?.name ?? 'LearnCard';
    const { colors, icons } = getThemedCategory(category);

    const section = RESUME_SECTIONS.find(section => section.key === category);
    const copy = getEmptySectionCopy(category, brandingName);

    if (!section || !copy) return null;

    const IconComponent = icons.IconWithLightShape ?? icons.IconWithShape ?? icons.Icon;

    return (
        <div className={className} data-pdf-screen-only>
            <div className="rounded-[24px] border border-dashed bg-white px-6 py-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between mt-4">
                <div className="flex items-start gap-4 min-w-0">
                    <div className="h-[86px] w-[86px] rounded-[24px] flex items-center justify-center shrink-0">
                        {IconComponent && <IconComponent className="h-[64px] w-[64px]" />}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xl font-bold text-grayscale-900">
                            {m['passport.resumeBuilder.emptySection.noCredentials']()}
                        </p>
                        <p className="mt-2 text-sm text-grayscale-600 max-w-[520px]">
                            <span className="font-semibold text-grayscale-800">
                                {copy.emphasis}
                            </span>{' '}
                            {copy.descriptionSuffix}
                        </p>
                    </div>
                </div>
                <div className="shrink-0 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={() =>
                            newModal(
                                <ResumeSelfAttestModal category={category} />,
                                {
                                    sectionClassName:
                                        '!max-w-[500px] !bg-transparent !shadow-none !overflow-visible',
                                },
                                { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                            )
                        }
                        className={`flex w-full md:inline-flex md:w-auto items-center justify-between gap-4 px-4 py-1.5 rounded-full shadow-sm bg-${colors.primaryColor}`}
                    >
                        <span className="text-[15px] font-semibold text-white">
                            {copy.actionLabel}
                        </span>
                        <div className="h-[30px] w-[30px] rounded-full flex items-center justify-center shadow-sm">
                            <GearPlusIcon className="h-full w-full text-grayscale-900" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResumePreviewSectionPlaceholder;
