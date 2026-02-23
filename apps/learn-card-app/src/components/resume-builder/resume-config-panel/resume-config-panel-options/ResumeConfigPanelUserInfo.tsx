import React, { useState } from 'react';

import { IonIcon } from '@ionic/react';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';

import { resumeUserInfo } from '../../resume-builder.helpers';
import { resumeBuilderStore } from '../../../../stores/resumeBuilderStore';

export const ResumeConfigPanelUserInfo: React.FC = () => {
    const [open, setOpen] = useState<boolean>(true);

    const personalDetails = resumeBuilderStore.useTracked.personalDetails();
    const setPersonalDetails = resumeBuilderStore.set.setPersonalDetails;

    return (
        <div className="border-b border-grayscale-100">
            <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpen(o => !o)}
            >
                <span className="text-sm font-semibold text-grayscale-800">Personal Info</span>
                <IonIcon icon={open ? chevronDownOutline : chevronUpOutline} />
            </button>
            {open && (
                <div className="px-4 pb-4 flex flex-col gap-3">
                    {resumeUserInfo.map(({ key, label, placeholder, multiline }) => (
                        <div key={key} className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-grayscale-500">
                                {label}
                            </label>
                            {multiline ? (
                                <textarea
                                    rows={3}
                                    className="w-full text-sm bg-grayscale-50 border border-grayscale-200 rounded-lg px-3 py-2 text-grayscale-800 placeholder-grayscale-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder={placeholder}
                                    value={personalDetails[key]}
                                    onChange={e => setPersonalDetails({ [key]: e.target.value })}
                                />
                            ) : (
                                <input
                                    type="text"
                                    className="w-full text-sm bg-grayscale-50 border border-grayscale-200 rounded-lg px-3 py-2 text-grayscale-800 placeholder-grayscale-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder={placeholder}
                                    value={personalDetails[key]}
                                    onChange={e => setPersonalDetails({ [key]: e.target.value })}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResumeConfigPanelUserInfo;
