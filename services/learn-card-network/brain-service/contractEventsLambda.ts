import type { Context } from 'aws-lambda';
import { dispatchContractEvents } from './src/helpers/contract-events.helpers';

/** Recover committed event intents after process failure; scheduler input cannot alter scope. */
export const contractEventsHandler = async (
    _event: unknown,
    context?: Pick<Context, 'getRemainingTimeInMillis'>
): Promise<{ delivered: number; pending: number; skipped: number }> =>
    dispatchContractEvents({
        limit: 100,
        budgetMs: Math.max(
            0,
            Math.min(45_000, (context?.getRemainingTimeInMillis() ?? 50_000) - 8_000)
        ),
    });
