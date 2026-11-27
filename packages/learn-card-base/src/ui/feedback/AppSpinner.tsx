import React from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import './feedback.css';

export type AppSpinnerName =
    | 'bubbles'
    | 'circles'
    | 'circular'
    | 'crescent'
    | 'dots'
    | 'lines'
    | 'lines-small'
    | 'lines-sharp'
    | 'lines-sharp-small';

/** React's CSS properties plus custom properties (call sites pass `--*` values through). */
export type AppSpinnerStyle = React.CSSProperties & {
    [customProperty: `--${string}`]: string | number | undefined;
};

export type AppSpinnerProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'color' | 'style'> & {
    /** Spinner shape. Omitted: `circular` in md, `lines` in ios (Ionic's default). */
    name?: AppSpinnerName;
    /**
     * Ionic palette color (`dark`, `light`, or a `variables.css` color such as `grayscale-900`). It adds
     * Ionic's `ion-color ion-color-<color>` classes, and `color: var(--ion-color-base)` uses them.
     * Omitted: the spinner inherits `currentColor`, so `text-*` utilities color it.
     */
    color?: string;
    /** Duration of one animation cycle, in ms. Values of 10 or less use the shape's default. */
    duration?: number;
    /** Stop the animation. Reduced-motion users always get a paused spinner. */
    paused?: boolean;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    style?: AppSpinnerStyle;
};

type SpinnerElement = {
    r?: number;
    cx?: number;
    cy?: number;
    y1?: number;
    y2?: number;
    viewBox?: string;
    transform?: string;
    style: React.CSSProperties;
};

type SpinnerConfig = {
    dur: number;
    circles?: number;
    lines?: number;
    /** The duration also goes on the host and the circle (`circular`). */
    elmDuration?: boolean;
    fn: (dur: number, index: number, total: number) => SpinnerElement;
};

/** Port of @ionic/core 8.7.2 `SPINNERS` (spinner-configs): identical geometry, delays and durations. */
const SPINNERS: Record<AppSpinnerName, SpinnerConfig> = {
    bubbles: {
        dur: 1000,
        circles: 9,
        fn: (dur, index, total) => {
            const angle = (2 * Math.PI * index) / total;
            return {
                r: 5,
                style: {
                    top: `${32 * Math.sin(angle)}%`,
                    left: `${32 * Math.cos(angle)}%`,
                    animationDelay: `${(dur * index) / total - dur}ms`,
                },
            };
        },
    },
    circles: {
        dur: 1000,
        circles: 8,
        fn: (dur, index, total) => {
            const step = index / total;
            const angle = 2 * Math.PI * step;
            return {
                r: 5,
                style: {
                    top: `${32 * Math.sin(angle)}%`,
                    left: `${32 * Math.cos(angle)}%`,
                    animationDelay: `${dur * step - dur}ms`,
                },
            };
        },
    },
    circular: {
        dur: 1400,
        elmDuration: true,
        circles: 1,
        fn: () => ({
            r: 20,
            cx: 48,
            cy: 48,
            viewBox: '24 24 48 48',
            transform: 'translate(0,0)',
            style: {},
        }),
    },
    crescent: {
        dur: 750,
        circles: 1,
        fn: () => ({ r: 26, style: {} }),
    },
    dots: {
        dur: 750,
        circles: 3,
        fn: (_, index) => ({
            r: 6,
            style: {
                left: `${32 - 32 * index}%`,
                animationDelay: `${-(110 * index)}ms`,
            },
        }),
    },
    lines: {
        dur: 1000,
        lines: 8,
        fn: (dur, index, total) => ({
            y1: 14,
            y2: 26,
            style: {
                transform: `rotate(${(360 / total) * index + (index < total / 2 ? 180 : -180)}deg)`,
                animationDelay: `${(dur * index) / total - dur}ms`,
            },
        }),
    },
    'lines-small': {
        dur: 1000,
        lines: 8,
        fn: (dur, index, total) => ({
            y1: 12,
            y2: 20,
            style: {
                transform: `rotate(${(360 / total) * index + (index < total / 2 ? 180 : -180)}deg)`,
                animationDelay: `${(dur * index) / total - dur}ms`,
            },
        }),
    },
    'lines-sharp': {
        dur: 1000,
        lines: 12,
        fn: (dur, index, total) => ({
            y1: 17,
            y2: 29,
            style: {
                transform: `rotate(${30 * index + (index < 6 ? 180 : -180)}deg)`,
                animationDelay: `${(dur * index) / total - dur}ms`,
            },
        }),
    },
    'lines-sharp-small': {
        dur: 1000,
        lines: 12,
        fn: (dur, index, total) => ({
            y1: 12,
            y2: 20,
            style: {
                transform: `rotate(${30 * index + (index < 6 ? 180 : -180)}deg)`,
                animationDelay: `${(dur * index) / total - dur}ms`,
            },
        }),
    },
};

const round = (value: number): number => Math.round(value * 1e6) / 1e6;

const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/**
 * The first frame of a paused spinner, as inline styles: the svg's and the circle's keyframe values at
 * time 0. Negative delays put each element part-way through its cycle.
 *
 * Ionic paused the animation (`animation-play-state`), which shows this frame. Inside `#app-router`
 * and `#modal-mid-root`, index.scss's reduced-motion rule removes light-DOM animations altogether, so
 * this frame is also written inline. The spinner then looks the same whether the animation is paused
 * or removed. The frame comes from the shape's class (`spinner-<name>`), as the CSS does.
 */
export const getPausedFrame = (
    name: string,
    delayMs: number,
    duration: number
): { svg: React.CSSProperties; circle: React.CSSProperties } => {
    const elapsed = Math.max(0, -delayMs);
    const progress = (elapsed % duration) / duration;

    switch (name) {
        case 'lines':
        case 'lines-small':
        case 'lines-sharp':
        case 'lines-sharp-small':
        case 'circles':
            // spinner-fade-out: opacity 1 -> 0, linear.
            return { svg: { opacity: round(1 - progress) }, circle: {} };
        case 'bubbles': {
            // spinner-scale-out: scale 1 -> 0, linear.
            const scale = round(1 - progress);
            return { svg: { transform: `scale(${scale}, ${scale})` }, circle: {} };
        }
        case 'dots': {
            // spinner-dots: 0% scale 1 / opacity .9, 50% scale .4 / opacity .3, 100% back; linear segments.
            const t = progress <= 0.5 ? progress / 0.5 : (progress - 0.5) / 0.5;
            const [scale, opacity] =
                progress <= 0.5
                    ? [lerp(1, 0.4, t), lerp(0.9, 0.3, t)]
                    : [lerp(0.4, 1, t), lerp(0.3, 0.9, t)];
            return {
                svg: {
                    transform: `scale(${round(scale)}, ${round(scale)})`,
                    opacity: round(opacity),
                },
                circle: {},
            };
        }
        case 'crescent':
            // spinner-rotate: 0deg -> 360deg, linear (crescent has no delay).
            return { svg: { transform: `rotate(${round(360 * progress)}deg)` }, circle: {} };
        case 'circular':
            // spinner-circular's only keyframe is 100%, so its first frame is the svg's own transform.
            // spinner-circular-inner 0%:
            return { svg: {}, circle: { strokeDasharray: '1px, 200px', strokeDashoffset: '0px' } };
        default:
            // Unknown names get the lines geometry but no animation (no `spinner-<name>` rules).
            return { svg: {}, circle: {} };
    }
};

/**
 * App-owned replacement for Ionic's `IonSpinner` (@ionic/core 8.7.2). It renders the same SVGs, with the
 * same geometry, durations, delays and keyframes, in the light DOM, in an inline-block `span` host.
 *
 * - The host defaults are 28px × 28px, inline-block and `color: var(--color)` (otherwise inherited).
 *   They are in a cascade layer, so `className` utilities (`w-4 h-4`, `scale-[2]`, `text-*`) and
 *   inline styles still win, as they did against Ionic's `:host`.
 * - `role="progressbar"` unless the caller passes a `role`. Other aria attributes pass through.
 *   It adds no label of its own (same as Ionic).
 * - Paused under `prefers-reduced-motion: reduce`, matching what the app's ReducedMotionManager did to
 *   `ion-spinner`. A paused spinner shows its first frame.
 */
export const AppSpinner: React.FC<AppSpinnerProps> = ({
    name,
    color,
    duration,
    paused = false,
    mode,
    className,
    style,
    role,
    ...rest
}) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const resolvedMode = mode ?? getIonMode();
    const spinnerName: string = name ?? (resolvedMode === 'ios' ? 'lines' : 'circular');
    const spinner = SPINNERS[spinnerName as AppSpinnerName] ?? SPINNERS.lines;
    const dur = typeof duration === 'number' && duration > 10 ? duration : spinner.dur;
    const isPaused = paused || prefersReducedMotion;

    const total = spinner.circles ?? spinner.lines ?? 0;
    const svgs: React.ReactNode[] = [];
    for (let index = 0; index < total; index++) {
        const data = spinner.fn(dur, index, total);
        const frame = isPaused
            ? getPausedFrame(spinnerName, parseFloat(String(data.style.animationDelay ?? 0)), dur)
            : { svg: {}, circle: {} };
        const svgStyle: React.CSSProperties = {
            ...data.style,
            animationDuration: `${dur}ms`,
            ...frame.svg,
        };
        svgs.push(
            <svg
                key={index}
                className="app-spinner-svg"
                viewBox={data.viewBox ?? '0 0 64 64'}
                style={svgStyle}
            >
                {spinner.circles !== undefined ? (
                    <circle
                        transform={data.transform ?? 'translate(32,32)'}
                        cx={data.cx}
                        cy={data.cy}
                        r={data.r}
                        style={{
                            ...(spinner.elmDuration ? { animationDuration: `${dur}ms` } : {}),
                            ...frame.circle,
                        }}
                    />
                ) : (
                    <line transform="translate(32,32)" y1={data.y1} y2={data.y2} />
                )}
            </svg>
        );
    }

    const classes = [
        className,
        'app-spinner',
        resolvedMode,
        `spinner-${spinnerName}`,
        isPaused ? 'spinner-paused' : undefined,
        color ? 'ion-color' : undefined,
        color ? `ion-color-${color}` : undefined,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <span
            {...rest}
            role={role ?? 'progressbar'}
            className={classes}
            style={spinner.elmDuration ? { animationDuration: `${dur}ms`, ...style } : style}
        >
            {svgs}
        </span>
    );
};
