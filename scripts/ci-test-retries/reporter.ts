import { mkdirSync, mkdtempSync, renameSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Reporter, TestModule, TestRunEndReason, Vitest } from 'vitest/node';
import type { SerializedError } from 'vitest';

/** One private report per Vitest process; Nx projects can finish concurrently. */
export class CiTestRetryReporter implements Reporter {
    private directory: string | undefined;
    private project = '';

    constructor(
        private readonly reportDirectory: string,
        private readonly repositoryRoot: string
    ) {}

    onInit(vitest: Vitest): void {
        mkdirSync(this.reportDirectory, { recursive: true });
        this.directory = mkdtempSync(join(this.reportDirectory, 'vitest-'));
        this.project = relative(this.repositoryRoot, vitest.config.root) || '.';
    }

    onTestRunEnd(
        modules: readonly TestModule[],
        errors: readonly SerializedError[],
        reason: TestRunEndReason
    ): void {
        const counts = { passed: 0, failed: 0, skipped: 0, pending: 0, recovered: 0 };
        const cases = [];
        for (const module of modules) {
            for (const test of module.children.allTests()) {
                const state = test.result().state;
                const retries = test.diagnostic()?.retryCount ?? 0;
                counts[state] += 1;
                if (state === 'passed' && retries > 0) counts.recovered += 1;
                if (retries > 0 || state === 'failed') {
                    cases.push({
                        file: relative(this.repositoryRoot, module.moduleId),
                        name: test.fullName,
                        line: test.location?.line,
                        state,
                        retries,
                    });
                }
            }
        }
        const report = {
            schemaVersion: 1,
            project: this.project,
            reason,
            counts,
            failedModules: modules.filter(module => module.state() === 'failed').length,
            unhandledErrors: errors.length,
            cases,
        };
        // Persist only case identities/counters, not errors, stacks or console output.
        if (!this.directory) throw new Error('CI retry reporter was not initialized.');
        const temporary = join(this.directory, 'report.tmp');
        writeFileSync(temporary, JSON.stringify(report), { mode: 0o600 });
        renameSync(temporary, join(this.directory, 'report.json'));
        // Nx cached terminal output retains the warning even when reports aren't restored.
        for (const test of cases.filter(test => test.state === 'passed' && test.retries > 0)) {
            console.warn(`[CI flaky] ${test.file}: ${test.name}`.replace(/[\r\n]/g, ' '));
        }
    }
}
