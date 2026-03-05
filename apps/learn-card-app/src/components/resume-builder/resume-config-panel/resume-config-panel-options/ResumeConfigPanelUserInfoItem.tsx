import React from 'react';

import LocationIcon from '../../../svgs/LocationIcon';
import LinkedInIcon from '../../../svgs/LinkedInIcon';
import { UserInfoEnum } from '../../resume-builder.helpers';
import ResumeBuilderToggle from '../../ResumeBuilderToggle';

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
    const showToggle = type !== UserInfoEnum.Name && type !== UserInfoEnum.Summary;
    const isLocation = type === UserInfoEnum.Location;
    const isLinkedIn = type === UserInfoEnum.LinkedIn;

    let icon: React.ReactNode = null;
    if (isLinkedIn) {
        icon = <LinkedInIcon className="w-4 h-4 text-grayscale-500 shrink-0" />;
    } else if (isLocation) {
        icon = <LocationIcon className="w-[32px] h-[32px] text-grayscale-500 shrink-0" />;
    }

    const plainInput = (
        <input
            type="text"
            className="resume-builder-input-bg w-full text-sm bg-grayscale-100 border border-grayscale-200 rounded-lg px-3 py-2 text-grayscale-800 placeholder-grayscale-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    );

    const decoratedInput = (
        <div className="resume-builder-input-bg w-full flex items-center gap-2 border border-grayscale-200 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-indigo-300 max-h-[38px]">
            {isLinkedIn && icon}
            <input
                type="text"
                className="w-full text-sm bg-transparent text-grayscale-800 placeholder-grayscale-400 focus:outline-none"
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
            />
            {isLocation && (
                <LocationIcon className="w-[32px] h-[32px] text-grayscale-500 shrink-0" />
            )}
        </div>
    );

    const multilineInput = (
        <textarea
            rows={4}
            className="resume-builder-input-bg w-full text-sm bg-grayscale-100 border border-grayscale-200 rounded-lg px-3 py-2 text-grayscale-800 placeholder-grayscale-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    );

    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-grayscale-700">{label}</label>

            <div className="flex items-center gap-2">
                {multiline && multilineInput}
                {(isLinkedIn || isLocation) && decoratedInput}
                {!(multiline || isLinkedIn || isLocation) && plainInput}
                {showToggle && (
                    <ResumeBuilderToggle checked={checked} onChange={onToggle} />
                )}
            </div>
        </div>
    );
};

export default ResumeConfigPanelUserInfoItem;
