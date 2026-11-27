import type { IonMode } from '../app-shell/ionMode';
import { playAnimation, type AnimationTrack, type OverlayAnimation } from './overlayAnimation';
import { getBackdropValueForSheet } from './sheetGesture';

/**
 * ion-modal's enter / leave animations (@ionic/core 8.7.2 `components/modal/animations`), for the
 * default and sheet modals the app uses (no card modals: nothing passes `presentingElement`).
 */
export type ModalParts = {
    backdrop: HTMLElement | null;
    wrapper: HTMLElement | null;
    /** The ios-only `.modal-shadow` twin of the wrapper. */
    shadow: HTMLElement | null;
};

type SheetOptions = { breakpoint?: number; backdropBreakpoint: number };

const MD_ENTER = { duration: 280, easing: 'cubic-bezier(0.36,0.66,0.04,1)' };
const MD_LEAVE = { duration: 200, easing: 'cubic-bezier(0.47,0,0.745,0.715)' };
const IOS = { duration: 500, easing: 'cubic-bezier(0.32,0.72,0,1)' };

const noPointer = {
    beforeStyles: { 'pointer-events': 'none' },
    afterClearStyles: ['pointer-events'],
};

const sliding = (parts: ModalParts, mode: IonMode): HTMLElement[] =>
    [parts.wrapper, mode === 'ios' ? parts.shadow : null].filter((el): el is HTMLElement => !!el);

const sheetEnterTracks = (
    parts: ModalParts,
    mode: IonMode,
    breakpoint: number,
    backdropBreakpoint: number
): AnimationTrack[] => {
    const showBackdrop = backdropBreakpoint < breakpoint;
    const wrapperFrames: Keyframe[] = [
        { offset: 0, opacity: 1, transform: 'translateY(100%)' },
        { offset: 1, opacity: 1, transform: `translateY(${100 - breakpoint * 100}%)` },
    ];
    return [
        {
            el: parts.backdrop,
            keyframes: [
                { offset: 0, opacity: 0 },
                {
                    offset: 1,
                    opacity: showBackdrop ? `calc(var(--backdrop-opacity) * ${breakpoint})` : '0',
                },
            ],
            ...(showBackdrop ? noPointer : {}),
        },
        ...sliding(parts, mode).map(el => ({
            el,
            keyframes: wrapperFrames,
            beforeStyles: mode === 'ios' ? { opacity: '1' } : undefined,
        })),
    ];
};

export const modalEnterAnimation = (
    mode: IonMode,
    parts: ModalParts,
    { breakpoint, backdropBreakpoint }: SheetOptions
): OverlayAnimation => {
    const timing = mode === 'ios' ? IOS : MD_ENTER;
    if (breakpoint !== undefined) {
        return playAnimation(sheetEnterTracks(parts, mode, breakpoint, backdropBreakpoint), timing);
    }
    const backdrop: AnimationTrack = {
        el: parts.backdrop,
        keyframes: [
            { offset: 0, opacity: 0.01 },
            { offset: 1, opacity: 'var(--backdrop-opacity)' },
        ],
        ...noPointer,
    };
    if (mode === 'ios') {
        return playAnimation(
            [
                ...sliding(parts, mode).map(el => ({
                    el,
                    keyframes: [
                        { offset: 0, transform: 'translateY(100vh)' },
                        { offset: 1, transform: 'translateY(0vh)' },
                    ],
                    beforeStyles: { opacity: '1' },
                })),
                backdrop,
            ],
            timing
        );
    }
    return playAnimation(
        [
            backdrop,
            {
                el: parts.wrapper,
                keyframes: [
                    { offset: 0, opacity: 0.01, transform: 'translateY(40px)' },
                    { offset: 1, opacity: 1, transform: 'translateY(0px)' },
                ],
            },
        ],
        timing
    );
};

export const modalLeaveAnimation = (
    mode: IonMode,
    parts: ModalParts,
    { breakpoint, backdropBreakpoint }: SheetOptions
): OverlayAnimation => {
    const timing = mode === 'ios' ? IOS : MD_LEAVE;
    if (breakpoint !== undefined) {
        const backdropValue = `calc(var(--backdrop-opacity) * ${getBackdropValueForSheet(breakpoint, backdropBreakpoint)})`;
        const backdropFrames: Keyframe[] =
            backdropBreakpoint !== 0
                ? [
                      { offset: 0, opacity: backdropValue },
                      { offset: backdropBreakpoint, opacity: 0 },
                      { offset: 1, opacity: 0 },
                  ]
                : [
                      { offset: 0, opacity: backdropValue },
                      { offset: 1, opacity: 0 },
                  ];
        const wrapperFrames: Keyframe[] = [
            { offset: 0, opacity: 1, transform: `translateY(${100 - breakpoint * 100}%)` },
            { offset: 1, opacity: 1, transform: 'translateY(100%)' },
        ];
        return playAnimation(
            [
                { el: parts.backdrop, keyframes: backdropFrames },
                ...sliding(parts, mode).map(el => ({
                    el,
                    keyframes: wrapperFrames,
                    beforeStyles: mode === 'ios' ? { opacity: '1' } : undefined,
                })),
            ],
            timing
        );
    }
    const backdrop: AnimationTrack = {
        el: parts.backdrop,
        keyframes: [
            { offset: 0, opacity: 'var(--backdrop-opacity)' },
            { offset: 1, opacity: 0 },
        ],
    };
    if (mode === 'ios') {
        return playAnimation(
            [
                ...sliding(parts, mode).map(el => ({
                    el,
                    keyframes: [
                        { offset: 0, transform: 'translateY(0vh)' },
                        { offset: 1, transform: 'translateY(100vh)' },
                    ],
                    beforeStyles: { opacity: '1' },
                })),
                backdrop,
            ],
            timing
        );
    }
    return playAnimation(
        [
            backdrop,
            {
                el: parts.wrapper,
                keyframes: [
                    { offset: 0, opacity: 0.99, transform: 'translateY(0px)' },
                    { offset: 1, opacity: 0, transform: 'translateY(40px)' },
                ],
            },
        ],
        timing
    );
};
