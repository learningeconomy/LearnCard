import fluentEmojiCssUrl from './assets/fonts/fluent-emoji/FluentEmojiFlat.css?url';

const LINK_ATTRIBUTE = 'data-fluent-emoji-font';

/**
 * Declares the Fluent Emoji Flat @font-face rules (used by `font-fluentEmoji`).
 *
 * The stylesheet is inserted from script, so it never blocks first paint the way the old
 * `@import url(https://tetunori.github.io/...)` in index.scss did (one cold start waited 30 s on it).
 * Emoji rendered before it loads use the system emoji font and swap in once it arrives.
 */
export const loadFluentEmojiFont = (doc: Document = document): void => {
    if (doc.head.querySelector(`link[${LINK_ATTRIBUTE}]`)) return;

    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = fluentEmojiCssUrl;
    link.setAttribute(LINK_ATTRIBUTE, '');
    doc.head.appendChild(link);
};
