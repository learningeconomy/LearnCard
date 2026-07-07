import React from 'react';
import { IonToggle } from '@ionic/react';

type SettingRowProps = {
    title: string;
    description?: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
    ariaLabel?: string;
    footer?: React.ReactNode;
};

const SettingRow: React.FC<SettingRowProps> = ({
    title,
    description,
    checked,
    disabled = false,
    onChange,
    ariaLabel,
    footer,
}) => (
    <div className="px-5 py-4 min-h-[64px]">
        <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-grayscale-900">{title}</p>
                {description && (
                    <p className="text-sm text-grayscale-500 mt-0.5 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            <IonToggle
                className="ds-toggle"
                checked={checked}
                disabled={disabled}
                onIonChange={e => !disabled && onChange(e.detail.checked)}
                aria-label={ariaLabel ?? title}
            />
        </div>
        {footer}
    </div>
);

export default SettingRow;
