/**
 * summarizeTermination — facade that delegates to the termination
 * registry. Mirrors `summarizePolicy`'s shape so both call sites
 * read identically.
 *
 * The per-kind logic lives on `build/termination/*Spec.tsx`. Keeping
 * this facade thin means the existing `summarizeTermination.test.ts`
 * suite exercises the registry specs transitively without needing to
 * know about them directly.
 */

import { TERMINATION_KINDS } from '../termination/registry';
import type { Termination } from '../../types';

import type { SummarizeContext } from './summarizePolicy';

export const summarizeTermination = (
    termination: Termination,
    ctx: SummarizeContext = {},
): string => {
    const spec = TERMINATION_KINDS[termination.kind];

    const summarize = spec.summarize as (
        value: typeof termination,
        ctx: SummarizeContext,
    ) => string;

    return summarize(termination, ctx);
};
