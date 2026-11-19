/**
 * Callback ref that focuses an element once, when it mounts. Use instead of the
 * `autoFocus` prop (jsx-a11y/no-autofocus) to choose a dialog's initial focus:
 * `Overlay` keeps focus that is already inside the dialog. Module-scoped so the
 * ref is stable and never re-focuses on re-render.
 */
export const focusOnMount = (element: HTMLElement | null): void => {
    element?.focus();
};
