export class AgentError extends Error {
    constructor(public readonly code: string) {
        super(code);
    }
}

/** Only registered values and coarse codes may enter diagnostics; never Docker output. */
export class Redactor {
    private readonly values = new Set<string>();
    add(value: string): void {
        if (value) this.values.add(value);
    }
    format(value: string): string {
        let result = value;
        for (const secret of [...this.values].sort((a, b): number => b.length - a.length)) {
            result = result.split(secret).join('[REDACTED]');
        }
        return result
            .replace(/(?:Bearer\s+|x-workload-agent-token\s*[:=]\s*)\S+/gi, '[REDACTED]')
            .replace(/^[A-Za-z_][A-Za-z0-9_]*=.*$/gm, '[REDACTED ENV]');
    }
    log(code: string): void {
        process.stdout.write(`${this.format(code)}\n`);
    }
    error(error: unknown): void {
        this.log(error instanceof AgentError ? error.code : 'AGENT_ERROR');
    }
}
