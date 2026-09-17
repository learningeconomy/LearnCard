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
    it('is the env fallback for --as on inbox list', async () => {
        const { registerInboxCommand } = await import('./inbox');
        const program = new Command();
        registerInboxCommand(program, async () => {});
        const list = program.commands
            .find(c => c.name() === 'inbox')!
            .commands.find(c => c.name() === 'list')!;
        const asOption = list.options.find(o => o.long === '--as')!;
        expect(asOption.envVar).toBe('LEARNCARD_AS');
    });
});
