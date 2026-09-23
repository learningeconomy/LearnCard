import { describe, expect, it } from 'vitest';
import { Command } from 'commander';

import { registerWhoamiCommand, summarizeServiceAccounts } from './whoami';
import type { AuthGrantWithActAs } from './auth-grant';

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

describe('summarizeServiceAccounts', () => {
    it('shapes active grants as { name, scope, actAs } for --json, dropping revoked ones', () => {
        const grants: AuthGrantWithActAs[] = [
            {
                id: 'g1',
                name: 'ea-clr-issuer',
                status: 'active',
                scope: 'inbox:write',
                actAs: 'sc-greenville,sc-north',
            },
            { id: 'g2', name: 'star-issuer', status: 'active', scope: 'inbox:write', actAs: '*' },
            { id: 'g3', name: 'no-delegation', status: 'active', scope: 'inbox:write' },
            { id: 'g4', name: 'old-issuer', status: 'revoked', scope: 'inbox:write', actAs: '*' },
        ];

        expect(summarizeServiceAccounts(grants)).toEqual([
            { name: 'ea-clr-issuer', scope: 'inbox:write', actAs: 'sc-greenville,sc-north' },
            { name: 'star-issuer', scope: 'inbox:write', actAs: '*' },
            { name: 'no-delegation', scope: 'inbox:write', actAs: undefined },
        ]);
    });

    it('returns an empty array when there are no grants', () => {
        expect(summarizeServiceAccounts([])).toEqual([]);
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
