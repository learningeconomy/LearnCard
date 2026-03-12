import React from 'react';

import { QRCodeSVG } from 'qrcode.react';
import { ProfilePicture } from 'learn-card-base';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';
import { TrustedIcon } from 'learn-card-base/svgs/TrustedIcon';
import ResumePreviewInfoChip from './ResumePreviewInfoChip';
import ResumeBuilderToggle from '../ResumeBuilderToggle';

import {
    PersonalDetails,
    UserInfoEnum,
    getLinkedInHandle,
    resumeUserInfo,
} from '../resume-builder.helpers';

const PRIMARY_CHIP_KEYS: (keyof PersonalDetails)[] = [UserInfoEnum.Career, UserInfoEnum.Location];
const CONTACT_CHIP_KEYS: (keyof PersonalDetails)[] = [
    UserInfoEnum.Email,
    UserInfoEnum.Phone,
    UserInfoEnum.Website,
    UserInfoEnum.LinkedIn,
];

const ResumePreviewUserInfo: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
    const personalDetails = resumeBuilderStore.useTracked.personalDetails();
    const hiddenPersonalDetails = resumeBuilderStore.useTracked.hiddenPersonalDetails();
    const documentSetup = resumeBuilderStore.useTracked.documentSetup();
    const setPersonalDetails = resumeBuilderStore.set.setPersonalDetails;
    const setPersonalDetailHidden = resumeBuilderStore.set.setPersonalDetailHidden;

    const placeholderByKey = Object.fromEntries(
        resumeUserInfo.map(field => [field.key, field.placeholder])
    ) as Record<UserInfoEnum, string>;

    const isFieldEnabled = (key: keyof PersonalDetails) => !hiddenPersonalDetails?.[key];
    const isFieldVisible = (key: keyof PersonalDetails) =>
        isFieldEnabled(key) && Boolean(personalDetails[key]?.trim());
    const showThumbnail = !hiddenPersonalDetails?.[UserInfoEnum.Thumbnail];

    const removeField = (key: keyof PersonalDetails) => {
        setPersonalDetails({ [key]: '' });
        setPersonalDetailHidden(key, false);
    };

    const updateField = (key: keyof PersonalDetails, value: string) => {
        setPersonalDetails({ [key]: value });
        setPersonalDetailHidden(key, false);
    };

    const hasVisibleUserInfo = readOnly
        ? showThumbnail || resumeUserInfo.some(field => isFieldVisible(field.key))
        : showThumbnail || resumeUserInfo.some(field => isFieldEnabled(field.key));

    if (!hasVisibleUserInfo) return null;

    const exportContactItems = [
        isFieldVisible(UserInfoEnum.Email) ? personalDetails.email : '',
        isFieldVisible(UserInfoEnum.Phone) ? personalDetails.phone : '',
        isFieldVisible(UserInfoEnum.Website) ? personalDetails.website : '',
        isFieldVisible(UserInfoEnum.LinkedIn)
            ? `linkedin.com/in/${getLinkedInHandle(personalDetails.linkedIn)}`
            : '',
    ].filter(Boolean);
    const exportPrimaryItems = [
        isFieldVisible(UserInfoEnum.Career) ? personalDetails.career : '',
        isFieldVisible(UserInfoEnum.Location) ? personalDetails.location : '',
    ].filter(Boolean);
    const showPrimaryChips = !readOnly || exportPrimaryItems.length > 0;
    const showSummary =
        isFieldEnabled(UserInfoEnum.Summary) &&
        (!readOnly || Boolean(personalDetails.summary.trim()));
    const showContactChips = !readOnly || exportContactItems.length > 0;

    return (
        <div className="border-b border-solid border-2 border-grayscale-100 bg-grayscale-50 p-4 mb-6 rounded-[20px]">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                    {showThumbnail && (
                        <div className="relative shrink-0">
                            <ProfilePicture
                                customContainerClass="text-grayscale-900 h-[60px] w-[60px] min-h-[60px] min-w-[60px] max-h-[60px] max-w-[60px] mt-[0px] mb-0"
                                customImageClass="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="min-w-0">
                        {isFieldEnabled(UserInfoEnum.Name) &&
                            (readOnly ? (
                                personalDetails.name.trim() ? (
                                    <h1 className="w-full text-3xl font-bold text-grayscale-900 tracking-tight">
                                        {personalDetails.name}
                                    </h1>
                                ) : null
                            ) : (
                                <input
                                    value={personalDetails.name}
                                    onChange={event =>
                                        updateField(UserInfoEnum.Name, event.target.value)
                                    }
                                    placeholder={placeholderByKey[UserInfoEnum.Name]}
                                    aria-label={placeholderByKey[UserInfoEnum.Name]}
                                    className="w-full bg-transparent border-none outline-none text-3xl font-bold text-grayscale-900 tracking-tight placeholder:text-grayscale-400"
                                />
                            ))}

                        {showPrimaryChips && (
                            <div data-pdf-screen-only className="flex flex-wrap gap-2 mt-2">
                                {(
                                    readOnly
                                        ? PRIMARY_CHIP_KEYS.filter(isFieldVisible)
                                        : PRIMARY_CHIP_KEYS.filter(isFieldEnabled)
                                ).map(key => (
                                    <ResumePreviewInfoChip
                                        key={key}
                                        detailKey={key}
                                        placeholder={placeholderByKey[key]}
                                        value={personalDetails[key]}
                                        onChange={readOnly ? undefined : updateField}
                                        onRemove={readOnly ? undefined : removeField}
                                    />
                                ))}
                            </div>
                        )}
                        {exportPrimaryItems.length > 0 && (
                            <p
                                data-pdf-export-block
                                style={{ display: 'none' }}
                                className="mt-1 text-sm text-grayscale-600"
                            >
                                {exportPrimaryItems.join(' \u00b7 ')}
                            </p>
                        )}
                    </div>
                </div>

                {documentSetup?.showQRCode && (
                    <div className="relative shrink-0 rounded-lg border border-grayscale-200 bg-white p-2">
                        <div className="absolute top-[-7px] right-[-7px]">
                            <TrustedIcon className="w-4 h-4" />
                        </div>

                        <QRCodeSVG value="https://learncard.app" size={44} />
                    </div>
                )}
            </div>

            {showSummary && (
                <div data-pdf-screen-only className="mt-4 flex items-start gap-3">
                    <div className="flex-1 rounded-xl bg-indigo-50 px-3 py-3 min-h-[96px] flex flex-col justify-between">
                        {readOnly ? (
                            personalDetails.summary.trim() ? (
                                <p className="w-full text-[13px] text-grayscale-900 leading-relaxed whitespace-pre-wrap">
                                    {personalDetails.summary}
                                </p>
                            ) : null
                        ) : (
                            <textarea
                                value={personalDetails.summary}
                                onChange={event =>
                                    updateField(UserInfoEnum.Summary, event.target.value)
                                }
                                placeholder={placeholderByKey[UserInfoEnum.Summary]}
                                aria-label={placeholderByKey[UserInfoEnum.Summary]}
                                rows={4}
                                className="w-full resize-none bg-transparent border-none outline-none text-[13px] text-grayscale-900 leading-relaxed placeholder:text-grayscale-500"
                            />
                        )}
                    </div>
                    {!readOnly && (
                        <div data-pdf-hide className="shrink-0 flex flex-col items-center gap-2 pt-0.5">
                            <ResumeBuilderToggle
                                checked={!hiddenPersonalDetails?.[UserInfoEnum.Summary]}
                                onChange={checked =>
                                    setPersonalDetailHidden(UserInfoEnum.Summary, !checked)
                                }
                            />
                        </div>
                    )}
                </div>
            )}
            {Boolean(personalDetails.summary.trim()) &&
                !hiddenPersonalDetails?.[UserInfoEnum.Summary] && (
                    <p
                        data-pdf-export-block
                        style={{ display: 'none' }}
                        className="mt-4 text-sm text-grayscale-700 leading-relaxed"
                    >
                        {personalDetails.summary}
                    </p>
                )}

            {showContactChips && (
                <div
                    data-pdf-screen-only
                    className="mt-4 pt-4 border-t border-grayscale-200 flex flex-wrap gap-2"
                >
                    {(
                        readOnly
                            ? CONTACT_CHIP_KEYS.filter(isFieldVisible)
                            : CONTACT_CHIP_KEYS.filter(isFieldEnabled)
                    ).map(key => (
                        <ResumePreviewInfoChip
                            key={key}
                            detailKey={key}
                            placeholder={placeholderByKey[key]}
                            value={personalDetails[key]}
                            onChange={readOnly ? undefined : updateField}
                            onRemove={readOnly ? undefined : removeField}
                        />
                    ))}
                </div>
            )}
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
