import React from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import './skeleton-progress.css';

/** React's CSS properties plus custom properties (`--background`, `--progress-background`). */
export type AppProgressBarStyle = React.CSSProperties & {
    [customProperty: `--${string}`]: string | number | undefined;
};

export type AppProgressBarProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'style'> & {
    /** `determinate` shows `value`; `indeterminate` animates. ion-progress-bar default: `determinate`. */
    type?: 'determinate' | 'indeterminate';
    /** Progress from 0 to 1 (clamped for display). ion-progress-bar default: `0`. */
    value?: number;
    /** Buffer from 0 to 1. Below 1 it shows the buffer track and moving dots. Default: `1`. */
    buffer?: number;
    /** Fill from the end instead (flipped again in RTL documents, as on Ionic). */
    reversed?: boolean;
    /**
     * Ionic palette color (`primary`, `danger`, or a `variables.css` color such as `grayscale-800`).
     * It adds Ionic's `ion-color ion-color-<color>` classes, which set `--ion-color-base`.
     * Omitted: `--progress-background` and `--background` (primary by default).
     */
    color?: string;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    style?: AppProgressBarStyle;
};

const clamp = (min: number, n: number, max: number): number => Math.max(min, Math.min(n, max));

/**
 * App-owned replacement for `IonProgressBar` (@ionic/core 8.7.2), with the same parts, transforms,
 * colors and animations, and `role="progressbar"` with `aria-valuenow` (determinate only),
 * `aria-valuemin="0"` and `aria-valuemax="1"`.
 */
export const AppProgressBar: React.FC<AppProgressBarProps> = ({
    type = 'determinate',
    value = 0,
    buffer = 1,
    reversed = false,
    color,
    mode,
    className,
    ...rest
}) => {
    const resolvedMode = mode ?? getIonMode();
    const isReversed =
        typeof document !== 'undefined' && document.dir === 'rtl' ? !reversed : reversed;
    const classes = [
        className,
        'app-progress-bar',
        `app-progress-bar-${resolvedMode}`,
        `app-progress-bar-${type}`,
        isReversed ? 'app-progress-bar-reversed' : '',
        buffer === 1 ? 'app-progress-bar-solid' : '',
        color ? 'ion-color' : '',
        color ? `ion-color-${color}` : '',
    ]
        .filter(Boolean)
        .join(' ');

    let parts: React.ReactNode;
    if (type === 'indeterminate') {
        parts = (
            <div className="app-progress-bar-buffer-bar">
                <div className="app-progress-bar-indeterminate-bar-primary">
                    <span className="app-progress-bar-progress-indeterminate" />
                </div>
                <div className="app-progress-bar-indeterminate-bar-secondary">
                    <span className="app-progress-bar-progress-indeterminate" />
                </div>
            </div>
        );
    } else {
        const finalValue = clamp(0, value, 1);
        const finalBuffer = clamp(0, buffer, 1);
        parts = (
            <>
                <div
                    className="app-progress-bar-progress"
                    style={{ transform: `scaleX(${finalValue})` }}
                />
                {/* Ionic meant to hide the dots at a full buffer; they sit off the end either way. */}
                <div
                    className="app-progress-bar-buffer-circles-container"
                    style={{
                        transform: `translateX(${finalBuffer * 100}%)`,
                        display: finalBuffer === 1 ? 'none' : undefined,
                    }}
                >
                    <div
                        className="app-progress-bar-buffer-circles-container"
                        style={{ transform: `translateX(-${finalBuffer * 100}%)` }}
                    >
                        <div className="app-progress-bar-buffer-circles" />
                    </div>
                </div>
                <div
                    className="app-progress-bar-buffer-bar"
                    style={{ transform: `scaleX(${finalBuffer})` }}
                />
            </>
        );
    }

    return (
        <div
            {...rest}
            role="progressbar"
            aria-valuenow={type === 'determinate' ? String(value) : undefined}
            aria-valuemin={0}
            aria-valuemax={1}
            className={classes}
        >
            {parts}
        </div>
    );
};

export default AppProgressBar;
