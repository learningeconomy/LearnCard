import React from 'react';
import numeral from 'numeral';
import CircleSpinner, { CircleLoadingState } from '../Loading/CircleSpinner';
import { Icons } from '../../types';
import { ICONS_TO_SOURCE } from '../../constants/icons';

export type CircleIconProps = {
    iconSrc?: string;
    count?: string | number;
    onClick?: () => void;
    bgColor?: string;
    innerPadding?: string;
    size?: string;
    borderColor?: string;
    loading?: boolean;
    iconCircleClass?: string;
};

export type CountCircleProps = {
    size?: string;
    count?: string | number;
    innerPadding?: string;
    onClick?: () => {};
    bgColor?: string;
    className?: string;
    loading?: boolean;
};

export const CountCircle: React.FC<CountCircleProps> = ({
    size = 'auto',
    count = '28',
    innerPadding = '3px 5px',
    onClick = () => {},
    bgColor = 'bg-grayscale-50',
    loading,
}) => {
    const _count = Number(count) >= 1000 ? numeral(Number(count)).format('0.0a') : count;
    const circleLoadingState = loading ? CircleLoadingState.spin : CircleLoadingState.stop;
    const style = {
        width: size,
        height: size,
        padding: !loading ? innerPadding : '0px',
        backgroundColor: bgColor,
    };

    const spinnerStyle = {
        transform: 'translateX(-2px) translateY(1px)',
    };

    return (
        <section onClick={onClick} className={`text-grayscale-50 rounded-full`} style={style}>
            {!loading && count && <p className="">{_count}</p>}
            {loading && (
                <div style={spinnerStyle}>
                    <CircleSpinner loadingState={circleLoadingState} thickness={3} size={20} />
                </div>
            )}
        </section>
    );
};

export const CircleIcon: React.FC<CircleIconProps> = ({
    iconSrc = ICONS_TO_SOURCE[Icons.coinsIcon],
    size = '52px',
    count = '28',
    onClick = () => {},
    loading,
    iconCircleClass = '',
}) => {
    const style = {
        width: size,
        height: size,
        backgroundColor: `rgba(24, 34, 78, 0.85)`,
    };

    return (
        <div style={style} className={`rounded-full ${iconCircleClass}`}>
            <section
                onClick={onClick}
                className={`flex flex-row-reverse justify-center items-center rounded-full relative overflow-hidden w-16 `}
                style={{ ...style, backgroundColor: 'transparent' }}
            >
                <CountCircle count={count} loading={loading} />
                <img src={iconSrc ?? ''} alt="Icon image" />
            </section>
        </div>
    );
};

export default CircleIcon;
