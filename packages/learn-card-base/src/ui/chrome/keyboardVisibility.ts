/**
 * Port of Ionic 8.7.2's keyboard controller (utils/keyboard/keyboard-controller.js), which
 * ion-footer used to drop its bottom safe-area padding while the native keyboard is up.
 *
 * Capacitor's Keyboard plugin fires `keyboardWillShow` / `keyboardWillHide` on window. When the
 * plugin resizes the web view, the hide is reported only once the resize container (the app root (`AppRoot`), or
 * the body) is back to the height it had before the keyboard opened, so the padding doesn't come
 * back while the page is still short.
 */

type KeyboardPlugin = { getResizeMode?: () => Promise<{ mode?: string } | undefined> };

type CapacitorGlobal = {
    isPluginAvailable?: (name: string) => boolean;
    Plugins?: { Keyboard?: KeyboardPlugin };
};

const getKeyboardPlugin = (): KeyboardPlugin | undefined => {
    const capacitor = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor;
    return capacitor?.isPluginAvailable?.('Keyboard') ? capacitor.Plugins?.Keyboard : undefined;
};

const getResizeMode = async (): Promise<string | undefined> => {
    const plugin = getKeyboardPlugin();
    if (!plugin?.getResizeMode) return undefined;
    try {
        return (await plugin.getResizeMode())?.mode;
    } catch {
        // Ionic treats an unimplemented native method as "no plugin".
        return undefined;
    }
};

const getResizeContainer = (resizeMode: string | undefined): HTMLElement | null =>
    resizeMode === undefined || resizeMode === 'none'
        ? null
        : (document.querySelector<HTMLElement>('.app-root') ?? document.body);

const getResizeContainerHeight = (resizeMode: string | undefined): number =>
    getResizeContainer(resizeMode)?.clientHeight ?? 0;

/** Calls `onChange(visible)` on keyboard show and (resize-settled) hide. Returns a cleanup. */
export const watchKeyboardVisibility = (onChange: (visible: boolean) => void): (() => void) => {
    let disposed = false;
    let initialHeight: number | undefined;
    let resizeMode: string | undefined;
    let observer: ResizeObserver | undefined;

    const onShow = (): void => {
        if (initialHeight === undefined) initialHeight = getResizeContainerHeight(resizeMode);
        observer?.disconnect();
        onChange(true);
    };

    const onHide = (): void => {
        const container = getResizeContainer(resizeMode);
        if (
            container === null ||
            initialHeight === 0 ||
            initialHeight === container.clientHeight ||
            typeof ResizeObserver === 'undefined'
        ) {
            onChange(false);
            return;
        }
        observer?.disconnect();
        observer = new ResizeObserver(() => {
            if (container.clientHeight !== initialHeight) return;
            observer?.disconnect();
            if (!disposed) onChange(false);
        });
        observer.observe(container);
    };

    void getResizeMode().then(mode => {
        if (disposed) return;
        resizeMode = mode;
        window.addEventListener('keyboardWillShow', onShow);
        window.addEventListener('keyboardWillHide', onHide);
    });

    return () => {
        disposed = true;
        observer?.disconnect();
        window.removeEventListener('keyboardWillShow', onShow);
        window.removeEventListener('keyboardWillHide', onHide);
    };
};
