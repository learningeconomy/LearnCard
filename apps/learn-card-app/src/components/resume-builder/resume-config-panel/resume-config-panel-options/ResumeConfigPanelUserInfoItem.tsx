import React from 'react';

import { IonToggle } from '@ionic/react';
import { UserInfoEnum } from '../../resume-builder.helpers';

type ResumeConfigPanelUserInfoItemProps = {
    type: UserInfoEnum;
    label: string;
    placeholder: string;
    value: string;
    checked: boolean;
    multiline?: boolean;
    onToggle: (checked: boolean) => void;
    onChange: (value: string) => void;
};

const ResumeConfigPanelUserInfoItem: React.FC<ResumeConfigPanelUserInfoItemProps> = ({
    type,
    label,
    placeholder,
    value,
    checked,
    multiline,
    onToggle,
    onChange,
}) => {
    const showToggle = type !== UserInfoEnum.Name;

    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-grayscale-700">{label}</label>

            <div className="flex items-center gap-2">
                {multiline ? (
                    <textarea
                        rows={4}
                        className="resume-builder-input-bg w-full text-sm bg-grayscale-100 border border-grayscale-200 rounded-lg px-3 py-2 text-grayscale-800 placeholder-grayscale-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder={placeholder}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                    />
                ) : (
                    <input
                        type="text"
                        className="resume-builder-input-bg w-full text-sm bg-grayscale-100 border border-grayscale-200 rounded-lg px-3 py-2 text-grayscale-800 placeholder-grayscale-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder={placeholder}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                    />
                )}
                {showToggle && (
                    <IonToggle
                        mode="ios"
                        className="family-cms-toggle"
                        checked={checked}
                        onIonChange={e => onToggle(e.detail.checked)}
                    />
                )}
            </div>
        </div>
    );
};

export default ResumeConfigPanelUserInfoItem;
