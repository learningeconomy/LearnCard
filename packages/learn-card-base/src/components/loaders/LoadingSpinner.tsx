import React from 'react';

type LoadingSpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

type LoadingSpinnerProps = {
    label?: string;
    size?: LoadingSpinnerSize;
};

const sizeClasses: Record<LoadingSpinnerSize, string> = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
    xl: 'h-[180px] w-[180px] border-8',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    label = 'Loading',
    size = 'md',
}) => {
    return (
        <div className="inline-flex items-center justify-center" role="status" aria-label={label}>
            <span
                aria-hidden="true"
                className={`${sizeClasses[size]} animate-spin rounded-full border-grayscale-200 border-t-emerald-600`}
            />
            <span className="sr-only">{label}</span>
        </div>
    );
};
