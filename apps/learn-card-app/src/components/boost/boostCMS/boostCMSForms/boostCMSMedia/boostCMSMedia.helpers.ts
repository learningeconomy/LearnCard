/**
 * Returns the topmost (most recently rendered) `#section-cancel-portal`
 * element in the DOM.
 *
 * CancelModals render their portal section with the id `section-cancel-portal`.
 * When modals are stacked (e.g. RecipientMediaAttachmentsModal opened on top of
 * ShortBoostUserOptions), there will be multiple elements sharing the same id.
 * `document.getElementById` returns the first match which belongs to the
 * outermost (hidden) modal. Portal children rendered into that node become
 * invisible to the user. This helper returns the last match — i.e. the portal
 * that belongs to the currently-active modal.
 */
export const getTopmostCancelPortal = (): HTMLElement | null =>
    Array.from(document.querySelectorAll<HTMLElement>('#section-cancel-portal')).at(-1) ?? null;
