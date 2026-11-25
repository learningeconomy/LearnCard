import type { Context } from 'aws-lambda';

import {
    dispatchContractEvents,
    type ContractEventDispatchSummary,
} from './src/helpers/contract-events.helpers';
import { runIntegrationEventPass } from './src/helpers/integration-events.helpers';
import { deliverContractRequestInvites } from './src/helpers/contract-request-invites.helpers';

const MAX_INTEGRATION_PASS_BUDGET_MS = 15_000;
const MAX_INVITE_DELIVERY_BUDGET_MS = 10_000;

/** Recover committed event intents after process failure; scheduler input cannot alter scope. */
export const contractEventsHandler = async (
    _event: unknown,
    context?: Pick<Context, 'getRemainingTimeInMillis'>
): Promise<ContractEventDispatchSummary> => {
    const budgetMs = Math.max(
        0,
        Math.min(45_000, (context?.getRemainingTimeInMillis() ?? 50_000) - 8_000)
    );
    const startedAt = Date.now();

    // The integration channel runs first with a bounded share of the budget, so neither
    // channel can starve the other. Its failure must not stop profile notifications.
    try {
        await runIntegrationEventPass({
            limit: 100,
            budgetMs: Math.min(MAX_INTEGRATION_PASS_BUDGET_MS, Math.floor(budgetMs / 3)),
        });
    } catch {
        console.warn('integration_events: pass_failed');
    }

    // Email-addressed sends are attached or emailed here, off the request path.
    try {
        await deliverContractRequestInvites({
            limit: 50,
            budgetMs: Math.min(MAX_INVITE_DELIVERY_BUDGET_MS, Math.floor(budgetMs / 4)),
        });
    } catch {
        console.warn('contract_request_invite: delivery_pending');
    }

    return dispatchContractEvents({
        limit: 100,
        budgetMs: Math.max(0, budgetMs - (Date.now() - startedAt)),
    });
};
