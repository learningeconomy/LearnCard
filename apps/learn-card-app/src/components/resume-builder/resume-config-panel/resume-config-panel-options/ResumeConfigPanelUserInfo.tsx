import React, { useEffect, useState } from 'react';

import { IonIcon, IonToggle } from '@ionic/react';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';

import { resumeUserInfo, UserInfoEnum } from '../../resume-builder.helpers';
import { resumeBuilderStore } from '../../../../stores/resumeBuilderStore';
import ResumeConfigPanelUserInfoItem from './ResumeConfigPanelUserInfoItem';

import { useCurrentUser, useGetCurrentLCNUser } from 'learn-card-base';

const ResumeConfigPanelUserInfo: React.FC = () => {
    const currentUser = useCurrentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const [open, setOpen] = useState<boolean>(true);

    const personalDetails = resumeBuilderStore.useTracked.personalDetails();
    const hiddenPersonalDetails = resumeBuilderStore.useTracked.hiddenPersonalDetails();
    const setPersonalDetails = resumeBuilderStore.set.setPersonalDetails;
    const setPersonalDetailHidden = resumeBuilderStore.set.setPersonalDetailHidden;

    const isEmpty = Object.values(personalDetails).every(v => !v);

    useEffect(() => {
        if (!isEmpty) return;

        if (currentLCNUser || currentUser) {
            setPersonalDetails({
                name: currentLCNUser?.displayName || currentUser?.name || '',
                career: '',
                email: currentLCNUser?.email || currentUser?.email || '',
                phone: currentUser?.phoneNumber || '',
                location: '',
                summary: currentLCNUser?.bio || '',
                website: '',
                linkedIn: '',
                thumbnail: currentLCNUser?.image || currentUser?.profileImage || '',
            });
        }
    }, [currentLCNUser, currentUser]);

    const thumbnailChecked = !hiddenPersonalDetails?.[UserInfoEnum.Thumbnail];

    return (
        <div className="bg-white border border-grayscale-200 rounded-2xl overflow-hidden">
            <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpen(o => !o)}
            >
                <span className="text-lg font-bold text-grayscale-900">Personal Info</span>
                <IonIcon
                    color="grayscale-800"
                    icon={open ? chevronDownOutline : chevronUpOutline}
                />
            </button>
            {open && (
                <div className="px-4 pb-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-grayscale-900">
                            Thumbnail • {thumbnailChecked ? 'On' : 'Off'}
                        </label>
                        <IonToggle
                            mode="ios"
                            className="family-cms-toggle"
                            checked={thumbnailChecked}
                            onIonChange={e =>
                                setPersonalDetailHidden(UserInfoEnum.Thumbnail, !e.detail.checked)
                            }
                        />
                    </div>

                    {resumeUserInfo.map(field => (
                        <ResumeConfigPanelUserInfoItem
                            key={field.key}
                            type={field.key}
                            label={field.label}
                            placeholder={field.placeholder}
                            multiline={field.multiline}
                            checked={!hiddenPersonalDetails?.[field.key]}
                            value={personalDetails[field.key]}
                            onToggle={checked => setPersonalDetailHidden(field.key, !checked)}
                            onChange={value => setPersonalDetails({ [field.key]: value })}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResumeConfigPanelUserInfo;
