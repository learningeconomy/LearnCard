/**
 * Ordered executor. Every step runs (negatives and failures never stop the run); a step
 * whose inputs an earlier step failed to produce reports BLOCKED instead. Only a failing
 * gate step (the doctor) blocks everything after it.
 *
 * Exit codes: 0 all good, 1 some step FAILed, 2 the doctor FAILed.
 */
import type { ScenarioPort } from '../port';
import { BlockedError, producerOf, registerProducers, type ScenarioIds } from './ids';
import { explainFailure } from './explain';
import { AssertionFailure, toScenarioError } from './expect';
import type { Reporter } from './report';
import type { ScenarioOptions, Step, StepResult, StepStatus } from './types';

export type RunSummary = { results: StepResult[]; exitCode: 0 | 1 | 2; ids: ScenarioIds };

const byId = (steps: readonly Step[], id: string): Step => {
    const step = steps.find(candidate => candidate.id.toLowerCase() === id.toLowerCase());
    if (!step) {
        throw new Error(`Unknown step ${id}; steps are ${steps.map(s => s.id).join(', ')}`);
    }
    return step;
};

/**
 * `--only X` runs X, `--from X` runs X and everything after it; both add the transitive
 * prerequisites (via needs → produces) so the selected steps have their inputs.
 */
export const selectSteps = (steps: readonly Step[], options: ScenarioOptions): Set<string> => {
    if (!options.only && !options.from) return new Set(steps.map(step => step.id));

    const seeds = options.only
        ? [byId(steps, options.only)]
        : steps.slice(steps.indexOf(byId(steps, options.from ?? '')));
    const selected = new Set<string>();
    const visit = (step: Step): void => {
        if (selected.has(step.id)) return;
        selected.add(step.id);
        for (const key of step.needs) {
            const producer = steps.find(candidate => candidate.produces.includes(key));
            if (producer) visit(producer);
        }
    };
    seeds.forEach(visit);
    // Gates always run.
    for (const step of steps) if (step.gate) selected.add(step.id);
    return selected;
};

const resultFor = (
    step: Step,
    status: StepStatus,
    reason: string,
    extra: Partial<StepResult> = {}
): StepResult => ({
    id: step.id,
    title: step.title,
    kind: step.kind,
    via: step.via,
    status,
    reason,
    labels: [],
    notes: [],
    ms: 0,
    ...extra,
});

export const runScenario = async (input: {
    steps: readonly Step[];
    port: ScenarioPort;
    options: ScenarioOptions;
    reporter: Reporter;
    runId: string;
}): Promise<RunSummary> => {
    const { steps, port, options, reporter, runId } = input;
    registerProducers(steps);
    const selected = selectSteps(steps, options);
    const runStartedAt = new Date().toISOString();
    const results: StepResult[] = [];
    let ids: ScenarioIds = {};
    let gateFailed: string | undefined;

    const finish = (result: StepResult): void => {
        results.push(result);
        reporter.stepFinished(result);
    };

    for (const step of steps) {
        if (step.deferred) {
            finish(resultFor(step, 'SKIP', step.deferred));
            continue;
        }
        if (step.drivers && !step.drivers.includes(options.driver)) {
            finish(resultFor(step, 'SKIP', `not run by the ${options.driver} driver`));
            continue;
        }
        if (!selected.has(step.id)) {
            finish(resultFor(step, 'SKIP', 'not selected'));
            continue;
        }
        if (gateFailed) {
            finish(resultFor(step, 'BLOCKED', `${gateFailed} failed`));
            continue;
        }
        const missing = step.needs.filter(key => ids[key] === undefined);
        if (missing.length) {
            const producers = [...new Set(missing.map(producerOf))];
            finish(resultFor(step, 'BLOCKED', `needs ${producers.join(', ')}`));
            continue;
        }

        reporter.stepStarted(step.id, step.title);
        const labels: string[] = [];
        const notes: string[] = [];
        // Steps write into a draft; only a step that did not fail publishes its ids.
        const draft: ScenarioIds = { ...ids };
        const started = Date.now();
        try {
            const outcome = await step.run({
                port,
                ids: draft,
                options,
                runId,
                runStartedAt,
                label: label => {
                    if (!labels.includes(label)) labels.push(label);
                },
                note: message => notes.push(message),
                results,
            });
            ids = draft;
            finish(
                resultFor(step, outcome?.status ?? 'PASS', outcome?.reason ?? '', {
                    labels,
                    notes,
                    ms: Date.now() - started,
                })
            );
        } catch (error) {
            const ms = Date.now() - started;
            if (error instanceof BlockedError) {
                finish(resultFor(step, 'BLOCKED', error.message, { labels, notes, ms }));
                continue;
            }
            const scenarioError = toScenarioError(error);
            const reason =
                error instanceof AssertionFailure || scenarioError.code === 'ERROR'
                    ? scenarioError.message
                    : `${scenarioError.code} '${scenarioError.message}'`;
            finish(
                resultFor(step, 'FAIL', reason, {
                    labels,
                    notes,
                    ms,
                    explain: await explainFailure(error, port, draft),
                })
            );
            if (step.gate) gateFailed = step.id;
        }
    }

    reporter.summary(results, { runId, driver: options.driver });

    const exitCode = gateFailed ? 2 : results.some(result => result.status === 'FAIL') ? 1 : 0;
    return { results, exitCode, ids };
};
