import React, { useEffect, useRef } from 'react';

import Toggle from 'learn-card-base/components/form-inputs/Toggle';

type AccessibleToggleProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    ariaLabel: string;
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'md';
};

/** Gives the shared visual toggle an accessible name without changing its UI. */
const AccessibleToggle: React.FC<AccessibleToggleProps> = ({ ariaLabel, ...toggleProps }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        containerRef.current
            ?.querySelector<HTMLButtonElement>('button[role="switch"]')
            ?.setAttribute('aria-label', ariaLabel);
    }, [ariaLabel]);

    return (
        <div ref={containerRef}>
            <Toggle {...toggleProps} />
        </div>
    );
};

export default AccessibleToggle;
