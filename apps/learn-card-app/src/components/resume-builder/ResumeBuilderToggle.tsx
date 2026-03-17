import React from 'react';

import { IonToggle } from '@ionic/react';
import HiddenIcon from '../svgs/HiddenIcon';

type ResumeBuilderToggleProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
};

const ResumeBuilderToggle: React.FC<ResumeBuilderToggleProps> = ({
    checked,
    onChange,
    disabled = false,
    className = '',
}) => {
    const iconPositionClass = checked ? 'right-[6px]' : 'left-[6px]';

    return (
        <div className={`flex items-center justify-center relative rounded-full ${className}`}>
            <IonToggle
                checked={checked}
                disabled={disabled}
                mode="ios"
                color="emerald-500"
                className={`family-cms-toggle rounded-full ${disabled ? 'opacity-50' : ''}`}
                onIonChange={e => onChange(e.detail.checked)}
            />
            {!checked && (
                <HiddenIcon
                    className={`h-5 w-5 text-grayscale-400 absolute ${iconPositionClass} z-10 pointer-events-none`}
                />
            )}
        </div>
    );
};

export default ResumeBuilderToggle;
