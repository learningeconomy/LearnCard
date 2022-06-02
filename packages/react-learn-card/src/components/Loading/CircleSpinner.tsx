import React from 'react';

import './CircleSpinner.css';

enum CircleLoadingState {
    loading,
    finishedLoading,
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
    const spinnerClass = CircleLoadingState.loading ? 'lds-ring' : 'lds-ring static';
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
