/**
 * Provisioning failures carry only a fixed step and an allowlisted reason. They
 * never carry upstream bodies, tokens, codes, keys or secret values.
 *
 * Exit codes: 1 = stopped safely, re-run (with `--resume` semantics automatic);
 * 2 = guard or usage refusal, nothing changed; 3 = needs a human (orphaned key,
 * malformed secret, stage conflict).
 */
export type ExitCode = 1 | 2 | 3;

export type ProvisionStep =
    | 'usage'
    | 'guard'
    | 'classify'
    | 'send'
    | 'mail'
    | 'prompt'
    | 'verify'
    | 'exchange'
    | 'token'
    | 'refresh'
    | 'status'
    | 'secret'
    | 'shares'
    | 'enroll'
    | 'activate'
    | 'check'
    | 'promote'
    | 'pool';

export class ProvisionError extends Error {
    constructor(
        readonly step: ProvisionStep,
        readonly reason: string,
        readonly exitCode: ExitCode = 1
    ) {
        super(`${step}: ${reason}`);
        this.name = 'ProvisionError';
    }
}

export const refuse = (step: ProvisionStep, reason: string): ProvisionError =>
    new ProvisionError(step, reason, 2);
export const needsHuman = (step: ProvisionStep, reason: string): ProvisionError =>
    new ProvisionError(step, reason, 3);

/** Fixed-string description of any error: a ProvisionError's own text, else the step only. */
export const describe = (step: ProvisionStep, error: unknown): ProvisionError =>
    error instanceof ProvisionError ? error : new ProvisionError(step, 'failed');
