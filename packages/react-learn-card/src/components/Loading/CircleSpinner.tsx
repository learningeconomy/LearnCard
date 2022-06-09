import React from 'react';

export enum CircleLoadingState {
    spin,
    stop,
}

export type CircleSpinnerProps = {
    size?: number; //in pixels
    thickness?: number;
    color?: string;
    loadingState?: CircleLoadingState;
    marginOffset?: number;
};

const CircleSpinner: React.FC<CircleSpinnerProps> = ({
    size = 60,
    thickness = 4,
    color = '#40CBA6',
    marginOffset = 3,
    loadingState = CircleLoadingState.stop,
}) => {
    const spinnerClass = loadingState === CircleLoadingState.spin ? 'lds-ring' : 'lds-ring static';

    // overall circumference height and width
    const outerStyle = {
        width: `${size}px`,
        height: `${size}px`,
    };

    // inner circle circumference is a ratio of the outer size
    // this is the actual spinning thing you see
    const spinnerStyles = {
        height: `${Math.floor(size / 1.1111111)}px`,
        width: `${Math.floor(size / 1.11111111)}px`,
        border: `${thickness}px solid #fff`,
        margin: `${marginOffset}px`,
        borderColor: `${color}${
            loadingState === CircleLoadingState.spin ? ' transparent transparent transparent' : ''
        }`,
    };
    return (
        <div className={spinnerClass} style={outerStyle}>
            <div style={spinnerStyles}></div>
            <div style={spinnerStyles}></div>
            <div style={spinnerStyles}></div>
            <div style={spinnerStyles}></div>
        </div>
    );
};

export default CircleSpinner;
