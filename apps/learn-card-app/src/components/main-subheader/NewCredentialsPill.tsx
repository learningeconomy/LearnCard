import React from 'react';

export interface NewCredentialsPillProps {
    count: number;
    label?: string;
    tone?: 'light' | 'onColor';
    className?: string;
}

export const NewCredentialsPill: React.FC<NewCredentialsPillProps> = ({
    count,
    label = 'New',
    tone = 'light',
    className = '',
}) => {
    if (count <= 0) return null;

    const toneClasses =
        tone === 'onColor' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700';

    return (
        <span
            className={`inline-flex items-center gap-[5px] rounded-full px-[10px] py-[3px] font-poppins text-[12px] font-semibold leading-none whitespace-nowrap ${toneClasses} ${className}`}
            aria-label={`${count} ${label}`}
        >
            <span className="w-[6px] h-[6px] rounded-full bg-current" />
            {count} {label}
        </span>
    );
};

export default NewCredentialsPill;
