/**
 * ion-header / ion-footer `collapse="fade"` (iOS only): the toolbar backgrounds fade with the
 * page's content scroll, through `--opacity-scale` on the header or footer.
 */

const CONTENT_SCROLL_HOST = '.ion-content-scroll-host';

type IonContentElement = HTMLElement & {
    componentOnReady?: () => Promise<unknown>;
    getScrollElement: () => Promise<HTMLElement>;
};

/**
 * Ionic's `findIonContent` + `getScrollElement`: the page's scroll element, or null. AppContent's
 * scroll area carries `.ion-content-scroll-host`, so it is found first.
 */
const findScrollElement = async (el: HTMLElement): Promise<HTMLElement | null> => {
    const page = el.closest<HTMLElement>('.app-root, ion-page, .ion-page, page-inner');
    if (!page) return null;
    const custom = page.querySelector<HTMLElement>(CONTENT_SCROLL_HOST);
    if (custom) return custom;
    const content = page.querySelector<IonContentElement>('ion-content');
    if (!content) return null;
    await content.componentOnReady?.();
    return content.getScrollElement();
};

const clamp = (min: number, value: number, max: number): number =>
    Math.max(min, Math.min(value, max));

/** Fade in over the first 10px of scroll (header) or out over the last 10px (footer). */
const FADE_DISTANCE = 10;

export const headerFadeScale = (scrollEl: HTMLElement): number =>
    clamp(0, scrollEl.scrollTop / FADE_DISTANCE, 1);

export const footerFadeScale = (scrollEl: HTMLElement): number => {
    const fadeStart = scrollEl.scrollHeight - scrollEl.clientHeight - FADE_DISTANCE;
    return clamp(0, 1 - (scrollEl.scrollTop - fadeStart) / FADE_DISTANCE, 1);
};

/** Tracks the scroll and writes `--opacity-scale` on `el`. Returns a cleanup function. */
export const attachScrollFade = (
    el: HTMLElement,
    scale: (scrollEl: HTMLElement) => number
): (() => void) => {
    let scrollEl: HTMLElement | null = null;
    let frame = 0;
    let disposed = false;

    const update = (): void => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
            if (scrollEl) el.style.setProperty('--opacity-scale', String(scale(scrollEl)));
        });
    };

    void findScrollElement(el).then(found => {
        if (disposed) return;
        if (!found) {
            console.error(
                'AppHeader/AppFooter collapse="fade" needs an AppContent, IonContent or .ion-content-scroll-host in the same page.'
            );
            return;
        }
        scrollEl = found;
        scrollEl.addEventListener('scroll', update);
        update();
    });

    return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        scrollEl?.removeEventListener('scroll', update);
    };
};
