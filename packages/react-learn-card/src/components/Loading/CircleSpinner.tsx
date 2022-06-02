import React from 'react';

import './CircleSpinner.css';

export enum CircleLoadingState {
    spin,
    stop,
}

export type CircleSpinnerProps = {
    size?: string | number;
    thickness?: number;
    color?: string;
    loadingState?: CircleLoadingState;
};

const CircleSpinner: React.FC<CircleSpinnerProps> = ({
    size = '60px',
    thickness = 8,
    color = '#40CBA6',
}) => {
    const spinnerClass = CircleLoadingState.stop ? 'lds-ring' : 'lds-ring static';
    return (
        <div className={spinnerClass}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    );
};

export default CircleSpinner;
