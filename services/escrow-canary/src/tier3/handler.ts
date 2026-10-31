import { loadConfig } from '../config';
import type { Emit } from '../metrics';
import { createSdk } from '../sdk';
import { createSecretStore } from '../secrets';
import { loadEvaluatorConfig, loadRunnerConfig } from './config';
import { runEvaluator } from './evaluator';
import { createS3Inbox } from './inbox';
import { createDynamoLedger } from './ledger';
import { runTier3, tier3Reason } from './runner';

export type Tier3Role = 'runner' | 'evaluator';

/**
 * Tier-3 dispatch. Neither role has a per-invocation success metric:
 * - runner silence is caught by StartAgeMinutes and step Overdue;
 * - the evaluator deliberately emits NOTHING on error, so the heartbeat alarm pages.
 */
export const handleTier3 = async (
    role: Tier3Role,
    event: { time: string },
    emit: Emit
): Promise<void> => {
    if (role === 'evaluator') {
        const config = loadEvaluatorConfig();
        await runEvaluator(event, config, { ledger: createDynamoLedger(config.ledgerTable), emit });
        return;
    }
    try {
        const base = loadConfig();
        const config = loadRunnerConfig();
        await runTier3(event, base, config, {
            ledger: createDynamoLedger(config.ledgerTable),
            inbox: createS3Inbox(config.inbox.bucket),
            secrets: createSecretStore(),
            sdk: createSdk(base),
            emit,
        });
    } catch (error) {
        emit('Step.Failure', 1, undefined, { reason: tier3Reason(error) });
        throw error;
    }
};
