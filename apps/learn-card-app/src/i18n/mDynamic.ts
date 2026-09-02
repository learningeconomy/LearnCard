import * as messages from '../paraglide/messages.js';

/** A Paraglide message function: takes optional named inputs, returns a string. */
type MessageFn = (inputs?: Record<string, unknown>) => string;

/**
 * Registry view of the generated Paraglide messages, keyed by message name. This
 * single `as unknown as` is the ONLY place the message module is treated as an
 * index signature — call sites stay fully typed through {@link mDynamic} and
 * never need their own `any` cast.
 */
const messageRegistry = messages as unknown as Record<string, MessageFn | undefined>;

/**
 * Resolve a Paraglide message by a key that isn't known at compile time — e.g. a
 * `labelKey`/`titleKey` read from a config object. Paraglide is type-safe for
 * static `m['literal']()` calls, but a dynamic `m[key]()` where `key` turns out
 * missing or misspelled evaluates to `undefined` and throws
 * "m[key] is not a function", white-screening the route.
 *
 * `mDynamic` guards that: it returns the resolved translation, or falls back to
 * the key string itself so a bad key degrades visibly instead of crashing.
 *
 * @param key    Dotted message key (e.g. `developerPortal.guides.useCases.embedApp.title`).
 * @param inputs Optional interpolation inputs (e.g. `{ count }`).
 */
export const mDynamic = (key: string, inputs?: Record<string, unknown>): string => {
    const fn = messageRegistry[key];
    return typeof fn === 'function' ? fn(inputs) : key;
};
