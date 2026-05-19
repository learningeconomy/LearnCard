import type { SuiteAdapter } from '../types';
import { svgMustacheAdapter } from './svg-mustache';

/**
 * Built-in adapters shipped with the designer. Consumers add more via the `adapters` prop on
 * `RenderMethodDesigner`. Custom adapters with the same `suite` as a built-in OVERRIDE the
 * built-in (last-write-wins) — this lets a consumer swap out the sanitizer policy without
 * forking the package.
 */
export const BUILT_IN_ADAPTERS: SuiteAdapter[] = [svgMustacheAdapter];

/**
 * Resolve the active adapter for the given suite name from the union of built-in and
 * consumer-supplied adapters. Returns `null` if no adapter is registered — callers MUST handle
 * the null case (the designer surfaces it as a validation error rather than crashing).
 */
export const resolveAdapter = (
    suite: string,
    consumerAdapters: SuiteAdapter[] = []
): SuiteAdapter | null => {
    // Consumer adapters take precedence so users can override built-ins.
    const all = [...BUILT_IN_ADAPTERS, ...consumerAdapters];
    // Iterate in reverse so the last-registered adapter wins for a given suite.
    for (let i = all.length - 1; i >= 0; i--) {
        if (all[i].suite === suite) return all[i];
    }
    return null;
};

export { svgMustacheAdapter };
