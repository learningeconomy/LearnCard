import { readFile } from 'node:fs/promises';
import {
    checkReady,
    closeStep,
    initPool,
    injectOverdue,
    pause,
    resume,
    summarize,
    unquarantine,
} from '../src/tier3/admin';
import { TIER3_POOL_SIZE } from '../src/tier3/config';
import { evaluate } from '../src/tier3/evaluator';
import { createDynamoLedger, parseItem, stepNames, type StepName } from '../src/tier3/ledger';

/**
 * Operator CLI for the tier-3 ledger (never secrets or escrow state).
 *   bun scripts/tier3-admin.ts <staging|production> <table> <command> [args]
 * Commands: init-pool | ready | list | close-step <runId> <Step> |
 *   unquarantine <hold-NN> | pause | resume | inject-overdue (staging only) |
 *   replay <snapshot.json> <ISO time>   (offline evaluator; no AWS access)
 */
const [environment, table, command, ...args] = process.argv.slice(2);
const usage = (): never => {
    console.error('Usage: tier3-admin <staging|production> <table> <command> [args]');
    process.exit(2);
};
if ((environment !== 'staging' && environment !== 'production') || !table || !command) usage();
const env = environment as 'staging' | 'production';

if (command === 'replay') {
    const [file, at] = args;
    if (!file || !at || !Number.isFinite(Date.parse(at))) usage();
    const items = (JSON.parse(await readFile(file, 'utf8')) as unknown[]).map(parseItem);
    console.log(JSON.stringify(evaluate(items, Date.parse(at), TIER3_POOL_SIZE)));
    process.exit(0);
}
const ledger = createDynamoLedger(table);
const context = { ledger, environment: env, now: Date.now() };
switch (command) {
    case 'init-pool':
        console.log(`created ${await initPool(context)} pool items`);
        break;
    case 'ready':
        await checkReady(context);
        console.log('ledger ready: tier3_enabled may be set');
        break;
    case 'list':
        for (const line of summarize(await ledger.scanAll())) console.log(line);
        break;
    case 'close-step': {
        const [runId, name] = args;
        if (!runId || !stepNames.includes(name as StepName)) usage();
        await closeStep(context, runId, name as StepName);
        break;
    }
    case 'unquarantine':
        if (!/^hold-\d{2}$/.test(args[0] ?? '')) usage();
        await unquarantine(context, args[0]);
        break;
    case 'pause':
        await pause(context);
        break;
    case 'resume':
        await resume(context);
        break;
    case 'inject-overdue':
        console.log(
            `drill run ${await injectOverdue(context)}; close with close-step <run> Warning`
        );
        break;
    default:
        usage();
}
