/**
 * Typed CLI errors and the single `--json` error envelope every command prints.
 *
 * `code` is a stable, machine-readable identifier agents can branch on; `hint` is the
 * one next step a human or agent should take; `detail` carries anything longer than
 * the first line of the message.
 */
export class CliError extends Error {
    code: string;
    hint?: string;
    detail?: string;

    constructor(message: string, options: { code: string; hint?: string; detail?: string }) {
        super(message);
        this.name = 'CliError';
        this.code = options.code;
        this.hint = options.hint;
        this.detail = options.detail;
    }
}

export const NO_IDENTITY_MESSAGE = 'No LearnCard identity in this folder.';
export const NO_IDENTITY_HINT =
    'Run `npx @learncard/cli init` (add `--network staging` to test safely), or `org apply <spec>`.';

/** Thrown by commands that read or act on an existing identity but must never create one. */
export class NoIdentityError extends CliError {
    constructor(hint: string = NO_IDENTITY_HINT) {
        super(NO_IDENTITY_MESSAGE, { code: 'NO_IDENTITY', hint });
        this.name = 'NoIdentityError';
    }
}

/** A flag or argument that is invalid before any I/O happens. */
export class UsageError extends CliError {
    constructor(message: string, hint?: string) {
        super(message, { code: 'USAGE', hint });
        this.name = 'UsageError';
    }
}

export interface ErrorEnvelope {
    ok: false;
    command: string | null;
    error: string;
    code: string;
    hint?: string;
    detail?: string;
}

/** Shape any thrown value as the `--json` error envelope (one line on stdout). */
export const errorEnvelope = (command: string | null, error: unknown): ErrorEnvelope => {
    const message =
        error instanceof Error
            ? error.message || 'Command failed. Please try again.'
            : 'Command failed. Please try again.';
    const firstLine = message.split('\n')[0]!.trim() || message.trim();
    const cliError = error instanceof CliError ? error : undefined;
    const detail =
        cliError?.detail ??
        (error instanceof Error
            ? message.includes('\n')
                ? message
                : undefined
            : error === undefined
              ? undefined
              : String(error));
    return {
        ok: false,
        command,
        error: firstLine,
        code: cliError?.code ?? 'ERROR',
        ...(cliError?.hint ? { hint: cliError.hint } : {}),
        ...(detail ? { detail } : {}),
    };
};

/** Human-mode lines for an error: the first line of the message, then the hint if any. */
export const humanErrorLines = (error: unknown): string[] => {
    const envelope = errorEnvelope(null, error);
    return envelope.hint ? [envelope.error, envelope.hint] : [envelope.error];
};
