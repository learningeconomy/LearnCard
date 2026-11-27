/**
 * A minimal stand-in for the parts of Ionic's `createAnimation` the overlay animations use: each
 * track animates one element with the Web Animations API (`fill: 'both'`, so the end state holds
 * until the overlay is torn down), inheriting the group's duration and easing unless it sets its
 * own. `beforeStyles` are written before playing and `afterClearStyles` removed when it finishes.
 */
export type AnimationTrack = {
    el: Element | null | undefined;
    keyframes: Keyframe[];
    duration?: number;
    easing?: string;
    beforeStyles?: Record<string, string>;
    afterClearStyles?: string[];
};

export type OverlayAnimation = { finished: Promise<void>; cancel: () => void };

export const playAnimation = (
    tracks: AnimationTrack[],
    { duration, easing }: { duration: number; easing: string }
): OverlayAnimation => {
    const animations: Animation[] = [];
    for (const track of tracks) {
        const el = track.el as HTMLElement | null | undefined;
        if (!el) continue;
        for (const [prop, value] of Object.entries(track.beforeStyles ?? {})) {
            el.style.setProperty(prop, value);
        }
        if (typeof el.animate !== 'function') continue;
        animations.push(
            el.animate(track.keyframes, {
                duration: track.duration ?? duration,
                easing: track.easing ?? easing,
                fill: 'both',
            })
        );
    }
    const finished = Promise.all(animations.map(a => a.finished.catch(() => undefined))).then(
        () => {
            for (const track of tracks) {
                const el = track.el as HTMLElement | null | undefined;
                for (const prop of track.afterClearStyles ?? []) el?.style.removeProperty(prop);
            }
        }
    );
    return { finished, cancel: () => animations.forEach(a => a.cancel()) };
};

/** Ionic's `keyboardClose`: an overlay opening or closing blurs a focused text field. */
export const blurFocusedTextField = (doc: Document): void => {
    const active = doc.activeElement as HTMLElement | null;
    if (active?.matches('input,ion-input, ion-textarea')) active.blur();
};

/** Serializes present / dismiss calls like Ionic's lock controller. */
export const createLock = () => {
    let last: Promise<unknown> = Promise.resolve();
    return <T>(task: () => Promise<T>): Promise<T> => {
        const run = last.then(task, task);
        last = run.catch(() => undefined);
        return run;
    };
};
