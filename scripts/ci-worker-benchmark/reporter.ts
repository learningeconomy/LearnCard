import { createHash } from 'node:crypto';
import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';
import type { Reporter, TestModule, TestRunEndReason, Vitest } from 'vitest/node';
import type { SerializedError } from 'vitest';

/** Records app test identities, rather than test output, for the isolated CI experiment. */
export class BenchmarkReporter implements Reporter {
    private root = '';
    private maxWorkers: number | undefined;

    constructor(private readonly reportPath: string) {}

    onInit(vitest: Vitest): void {
        this.root = vitest.config.root;
        this.maxWorkers = vitest.config.maxWorkers;
    }

    onTestRunEnd(
        modules: readonly TestModule[],
        errors: readonly SerializedError[],
        reason: TestRunEndReason
    ): void {
        const files: string[] = [];
        const cases: string[] = [];
        for (const module of modules) {
            const file = relative(this.root, module.moduleId).replaceAll('\\', '/');
            files.push(file);
            for (const test of module.children.allTests()) {
                cases.push(JSON.stringify([file, test.fullName, test.location?.line ?? null]));
            }
        }
        files.sort();
        cases.sort();
        const report = {
            version: 1,
            reason,
            unhandledErrors: errors.length,
            maxWorkers: this.maxWorkers,
            files,
            caseCount: cases.length,
            caseIdentitySha256: createHash('sha256').update(JSON.stringify(cases)).digest('hex'),
        };
        mkdirSync(dirname(this.reportPath), { recursive: true });
        const temporary = `${this.reportPath}.tmp`;
        writeFileSync(temporary, JSON.stringify(report), { mode: 0o600 });
        renameSync(temporary, this.reportPath);
    }
}
