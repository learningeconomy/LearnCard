/**
 * TransP — Paraglide wrapper that mirrors react-i18next's `<Trans>` API.
 *
 * The Phase 1 POC used `renderParts(m['key'].parts({…}), { '0': … })` directly
 * for any string containing inline markup placeholders (`<0>…</0>`). That
 * works, but mechanically translating a `<Trans>` JSX element into a function
 * call wrapping another function call is awkward — codemods kept failing on
 * multi-line / multi-component / with-or-without-values variants, and the
 * Phase 2 dispatch ended up falling back to plain `m['key']()` calls, which
 * silently drops the inline markup styling.
 *
 * `TransP` gives us a JSX-shaped component with the same prop names react-
 * i18next's `<Trans>` uses (`values`, `components`), so the conversion from
 * one branch to the other is a near-1:1 rename:
 *
 *   // react-i18next branch
 *   <Trans
 *     i18nKey="login.welcome.heading"
 *     defaults="Welcome to <0>{{brand}}</0>"
 *     values={{ brand }}
 *     components={[<span className="font-bold" />]}
 *   />
 *
 *   // Paraglide branch
 *   <TransP
 *     m={m['login.welcome.heading']}
 *     values={{ brand }}
 *     components={[<span className="font-bold" />]}
 *   />
 *
 * Why drop `defaults`? Paraglide already bakes the English string into
 * `m['key']` at compile time, so any default-fallback prop on this side is
 * redundant noise. Removing it keeps the codemod simple.
 *
 * `components` is an array indexed by the `<0>`, `<1>`, … markers in the
 * source string — same convention as react-i18next.
 */
import React from 'react';

import { renderParts, type MessagePart } from './index';

/**
 * Shape of a Paraglide message function.
 *
 * Paraglide's @inlang/plugin-i18next emits each message as a callable that
 * also carries a `.parts()` method. The callable returns the resolved string
 * (after interpolation) for the active locale; `.parts()` returns the same
 * resolution decomposed into text + markup nodes for components like this one
 * that need to splice React elements into the message.
 */
export type ParaglideMessage = {
    (inputs?: Record<string, unknown>): string;
    parts: (inputs?: Record<string, unknown>) => MessagePart[];
};

type TransPProps = {
    /** The Paraglide message function — e.g. `m['login.welcome.heading']`. */
    m: ParaglideMessage;
    /** Interpolation values for `{{var}}` placeholders. */
    values?: Record<string, unknown>;
    /**
     * React elements to splice in at `<0>`, `<1>`, … markup positions. Array
     * indices map directly to placeholder numbers — `components[0]` wraps the
     * content between `<0>` and `</0>`, `components[1]` wraps `<1>…</1>`, etc.
     */
    components?: React.ReactElement[];
};

export const TransP: React.FC<TransPProps> = ({ m, values, components = [] }) => {
    const parts = m.parts(values ?? {});
    const componentMap = components.reduce<Record<string, React.ReactElement>>(
        (acc, el, i) => ({ ...acc, [String(i)]: el }),
        {},
    );
    return <>{renderParts(parts, componentMap)}</>;
};

export default TransP;
