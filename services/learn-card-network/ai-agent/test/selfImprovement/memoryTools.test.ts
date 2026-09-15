import { describe, expect, it } from 'vitest';

import { createUserMemoryTools } from '../../src/selfImprovement/memoryTools';
import {
    createInMemoryUserDocRepository,
    createUserDocService,
} from '../../src/selfImprovement/userDocs';

describe('user memory tools', () => {
    it('remembers and forgets active memory for the request DID', async () => {
        const userDocs = createUserDocService(createInMemoryUserDocRepository());
        const tools = createUserMemoryTools({ ownerDid: 'did:key:user', userDocs });
        const remember = tools.find(tool => tool.name === 'rememberUserMemory');
        const forget = tools.find(tool => tool.name === 'forgetUserMemory');

        if (!remember || !forget) throw new Error('Expected memory tools.');

        await expect(
            remember.execute(
                {
                    name: 'answer_style',
                    kind: 'memory',
                    description: 'Answer style preference.',
                    content: '# Answer Style\n\nTaylor prefers concise answers.',
                    reason: 'User explicitly asked to remember it.',
                },
                { runId: 'run-1' }
            )
        ).resolves.toMatchObject({
            action: 'created',
            doc: {
                name: 'answer_style',
                status: 'active',
                sourceType: 'user-stated',
            },
        });
        await expect(userDocs.getActiveDoc('did:key:user', 'answer_style')).resolves.toMatchObject({
            content: '# Answer Style\n\nTaylor prefers concise answers.',
        });

        await expect(
            forget.execute(
                { name: 'answer_style', reason: 'User asked to forget it.' },
                { runId: 'run-2' }
            )
        ).resolves.toMatchObject({
            action: 'archived',
            doc: {
                name: 'answer_style',
                status: 'archived',
            },
        });
        await expect(
            userDocs.getActiveDoc('did:key:user', 'answer_style')
        ).resolves.toBeUndefined();
    });

    it('proposes inferred memory without exposing it through readSkill', async () => {
        const userDocs = createUserDocService(createInMemoryUserDocRepository());
        const tools = createUserMemoryTools({ ownerDid: 'did:key:user', userDocs });
        const propose = tools.find(tool => tool.name === 'proposeUserMemory');

        if (!propose) throw new Error('Expected propose memory tool.');

        await expect(
            propose.execute(
                {
                    name: 'possible_goal',
                    kind: 'memory',
                    description: 'Possible goal.',
                    content: '# Possible Goal\n\nTaylor may be exploring agent memory.',
                },
                { runId: 'run-1' }
            )
        ).resolves.toMatchObject({
            action: 'created',
            doc: {
                name: 'possible_goal',
                status: 'proposed',
                sourceType: 'agent-inferred',
                requiresApproval: true,
            },
        });
        await expect(userDocs.createSkillDefinitions('did:key:user')).resolves.toEqual([]);
    });

    it('accepts null expiresAt from tool arguments', async () => {
        const userDocs = createUserDocService(createInMemoryUserDocRepository());
        const tools = createUserMemoryTools({ ownerDid: 'did:key:user', userDocs });
        const remember = tools.find(tool => tool.name === 'rememberUserMemory');

        if (!remember) throw new Error('Expected remember memory tool.');

        await expect(
            remember.execute(
                {
                    name: 'answer_style',
                    kind: 'memory',
                    description: 'Answer style preference.',
                    content: '# Answer Style\n\nTaylor prefers concise answers.',
                    expiresAt: null,
                },
                { runId: 'run-1' }
            )
        ).resolves.toMatchObject({
            action: 'created',
            doc: {
                name: 'answer_style',
                status: 'active',
            },
        });

        const doc = await userDocs.getActiveDoc('did:key:user', 'answer_style');

        expect(doc?.expiresAt).toBeUndefined();
    });
});
