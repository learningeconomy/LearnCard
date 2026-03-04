import React, { useMemo } from 'react';

import { IonToggle } from '@ionic/react';
import { QRCodeSVG } from 'qrcode.react';
import { ProfilePicture } from 'learn-card-base';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';
import ResumePreviewInfoChip from './ResumePreviewInfoChip';

import { PersonalDetails, getLinkedInHandle } from '../resume-builder.helpers';

const ResumePreviewUserInfo: React.FC = () => {
    const personalDetails = resumeBuilderStore.useTracked.personalDetails();
    const hiddenPersonalDetails = resumeBuilderStore.useTracked.hiddenPersonalDetails();
    const setPersonalDetails = resumeBuilderStore.set.setPersonalDetails;
    const setPersonalDetailHidden = resumeBuilderStore.set.setPersonalDetailHidden;

    const isFieldVisible = (key: keyof PersonalDetails) =>
        !hiddenPersonalDetails?.[key] && Boolean(personalDetails[key]?.trim());

    const hasPersonalInfo = useMemo(() => {
        return Object.values(personalDetails).some(v => v.trim());
    }, [personalDetails]);

    if (!hasPersonalInfo) return null;

    const removeField = (key: keyof PersonalDetails) => {
        setPersonalDetails({ [key]: '' });
        setPersonalDetailHidden(key, false);
    };

    const exportContactItems = [
        isFieldVisible('email') ? personalDetails.email : '',
        isFieldVisible('phone') ? personalDetails.phone : '',
        isFieldVisible('website') ? personalDetails.website : '',
        isFieldVisible('linkedIn')
            ? `linkedin.com/in/${getLinkedInHandle(personalDetails.linkedIn)}`
            : '',
    ].filter(Boolean);

    return (
        <div className="border-b border-solid border-2 border-grayscale-100 bg-grayscale-50 p-4 mb-6 rounded-[20px]">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="relative shrink-0">
                        <ProfilePicture
                            customContainerClass="text-grayscale-900 h-[60px] w-[60px] min-h-[60px] min-w-[60px] max-h-[60px] max-w-[60px] mt-[0px] mb-0"
                            customImageClass="w-full h-full object-cover"
                        />
                    </div>

                    <div className="min-w-0">
                        {isFieldVisible('name') && (
                            <h1 className="text-3xl font-bold text-grayscale-900 tracking-tight">
                                {personalDetails.name}
                            </h1>
                        )}

                        <div data-pdf-screen-only className="flex flex-wrap gap-2 mt-2">
                            {isFieldVisible('location') && (
                                <ResumePreviewInfoChip
                                    detailKey="location"
                                    value={personalDetails.location}
                                    onRemove={removeField}
                                />
                            )}
                        </div>
                        {isFieldVisible('location') && (
                            <p
                                data-pdf-export-block
                                style={{ display: 'none' }}
                                className="mt-1 text-sm text-grayscale-600"
                            >
                                {personalDetails.location}
                            </p>
                        )}
                    </div>
                </div>

                <div className="shrink-0 rounded-lg border border-grayscale-200 bg-white p-2">
                    <QRCodeSVG value="https://learncard.app" size={44} />
                </div>
            </div>

            {Boolean(personalDetails.summary.trim()) && (
                <div data-pdf-screen-only className="mt-4 flex items-start gap-3">
                    <div className="flex-1 rounded-xl bg-indigo-50 px-3 py-3 min-h-[96px] flex flex-col justify-between">
                        <p className="text-[13px] text-grayscale-900 leading-relaxed">
                            {personalDetails.summary}
                        </p>

                        <span className="text-xs text-grayscale-500 self-end text-right">
                            Default Summary
                        </span>
                    </div>
                    <div data-pdf-hide className="shrink-0 flex flex-col items-center gap-2 pt-0.5">
                        <IonToggle
                            mode="ios"
                            className="family-cms-toggle"
                            checked={!hiddenPersonalDetails?.summary}
                            onIonChange={e => setPersonalDetailHidden('summary', !e.detail.checked)}
                        />
                    </div>
                </div>
            )}
            {Boolean(personalDetails.summary.trim()) && !hiddenPersonalDetails?.summary && (
                <p
                    data-pdf-export-block
                    style={{ display: 'none' }}
                    className="mt-4 text-sm text-grayscale-700 leading-relaxed"
                >
                    {personalDetails.summary}
                </p>
            )}

            <div
                data-pdf-screen-only
                className="mt-4 pt-4 border-t border-grayscale-200 flex flex-wrap gap-2"
            >
                {isFieldVisible('email') && (
                    <ResumePreviewInfoChip
                        detailKey="email"
                        value={personalDetails.email}
                        onRemove={removeField}
                    />
                )}
                {isFieldVisible('phone') && (
                    <ResumePreviewInfoChip
                        detailKey="phone"
                        value={personalDetails.phone}
                        onRemove={removeField}
                    />
                )}
                {isFieldVisible('website') && (
                    <ResumePreviewInfoChip
                        detailKey="website"
                        value={personalDetails.website}
                        onRemove={removeField}
                    />
                )}
                {isFieldVisible('linkedIn') && (
                    <ResumePreviewInfoChip
                        detailKey="linkedIn"
                        value={personalDetails.linkedIn}
                        onRemove={removeField}
                    />
                )}
            </div>
            {exportContactItems.length > 0 && (
                <p
                    data-pdf-export-block
                    style={{ display: 'none' }}
                    className="mt-4 pt-4 border-t border-grayscale-200 text-sm text-grayscale-600"
                >
                    {exportContactItems.join(' \u00b7 ')}
                </p>
            )}
        </div>
    );
};

export default ResumePreviewUserInfo;
