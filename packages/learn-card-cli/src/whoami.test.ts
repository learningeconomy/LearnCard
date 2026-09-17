import { describe, expect, it } from 'vitest';
import { Command } from 'commander';

import { registerWhoamiCommand } from './whoami';

describe('whoami command', () => {
    it('registers with --network and --json only', () => {
        const program = new Command();
        registerWhoamiCommand(program, async () => {});
        const cmd = program.commands.find(c => c.name() === 'whoami');
        expect(cmd).toBeDefined();
        expect(cmd!.options.map(o => o.long).sort()).toEqual(['--json', '--network']);
    });
});

describe('LEARNCARD_AS', () => {
    it('is accepted as the env fallback for --as on send and inbox list', async () => {
        const source = await import('node:fs/promises').then(fs =>
            Promise.all([
                fs.readFile(new URL('./index.tsx', import.meta.url), 'utf8'),
                fs.readFile(new URL('./inbox.ts', import.meta.url), 'utf8'),
            ])
        );
        for (const text of source) expect(text).toContain(".env('LEARNCARD_AS')");
    });
});
