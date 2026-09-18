import { describe, expect, it } from 'vitest';
import { Command } from 'commander';

import { registerWhoamiCommand } from './whoami';

describe('whoami command', () => {
    it('registers with --network and --json only', () => {
        const program = new Command();
        registerWhoamiCommand(program, async () => {});
        const cmd = program.commands.find(c => c.name() === 'whoami');
        expect(cmd).toBeDefined();
        expect(
            program
                .createHelp()
                .visibleOptions(cmd!)
                .map(o => o.long)
                .filter(l => l !== '--help')
                .sort()
        ).toEqual(['--json', '--network']);
    });
});

describe('LEARNCARD_AS', () => {
    it('is the env fallback for --as on inbox list', async () => {
        const { registerInboxCommand } = await import('./inbox');
        const program = new Command().exitOverride();
        let seen: Record<string, unknown> | undefined;
        registerInboxCommand(program, async (_cmd, options) => {
            seen = options as Record<string, unknown>;
        });
        process.env.LEARNCARD_AS = 'cs-exampleville';
        try {
            await program.parseAsync(['node', 'learncard', 'inbox', 'list']);
        } finally {
            delete process.env.LEARNCARD_AS;
        }
        expect(seen?.as).toBe('cs-exampleville');
    });
});
