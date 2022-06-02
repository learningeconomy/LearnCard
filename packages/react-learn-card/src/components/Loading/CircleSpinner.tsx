import React from 'react';

import './CircleSpinner.css';

export type CircleSpinnerProps = {
    size?: string | number;
    thickness?: number;
    color?: string;
};

const CircleSpinner: React.FC<CircleSpinnerProps> = ({ size = '35px', thickness = 8, color = '#ffffff' }) => {
    const style = {
        width: size,
        height: size,
        border: `${thickness}px solid ${color}`,
    };
    return (
        <div className="lds-ring" style={style}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    );
};

export default CircleSpinner;
