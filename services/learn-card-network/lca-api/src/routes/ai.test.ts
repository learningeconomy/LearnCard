import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    SKILL_ICON_MAX_CHARACTERS_PER_REQUEST,
    SKILL_ICON_MAX_NAMES_PER_REQUEST,
} from '@learncard/types';

const mocks = vi.hoisted(() => ({
    create: vi.fn(),
}));

vi.mock('@environment', () => ({ environment: { OPENAI_API_KEY: 'test-key' } }));
vi.mock('openai', () => ({
    default: class {
        chat = { completions: { create: mocks.create } };
    },
}));
vi.mock('filestack-js', () => ({ init: () => ({}) }));
vi.mock('@routes', async () => {
    const { initTRPC } = await import('@trpc/server');
    const t = initTRPC.create();
    return { t, didAndChallengeRoute: t.procedure };
});

import { aiRouter } from './ai';

const caller = aiRouter.createCaller({ user: { did: 'did:example:123' } } as never);

const respondWithIcons = (): void => {
    mocks.create.mockImplementation(async ({ messages }: { messages: { content: string }[] }) => {
        const names = [...messages[1]!.content.matchAll(/^- (.*)$/gm)].map(match => match[1]);

        return {
            choices: [
                {
                    message: {
                        content: JSON.stringify({
                            items: names.map(name => ({ name, icon: '🎯' })),
                        }),
                    },
                },
            ],
        };
    });
};

describe('generateSkillIcons input validation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        respondWithIcons();
    });

    it('accepts a batch at both limits', async () => {
        const names = Array.from({ length: SKILL_ICON_MAX_NAMES_PER_REQUEST }, (_, i) =>
            `${i}`.padStart(
                SKILL_ICON_MAX_CHARACTERS_PER_REQUEST / SKILL_ICON_MAX_NAMES_PER_REQUEST,
                'x'
            )
        );

        const result = await caller.generateSkillIcons({ names });

        expect(Object.keys(result)).toHaveLength(SKILL_ICON_MAX_NAMES_PER_REQUEST);
        expect(mocks.create).toHaveBeenCalledTimes(1);
    });

    it('rejects too many names with BAD_REQUEST before calling the model', async () => {
        const names = Array.from(
            { length: SKILL_ICON_MAX_NAMES_PER_REQUEST + 1 },
            (_, i) => `s${i}`
        );

        await expect(caller.generateSkillIcons({ names })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it('rejects names totalling more than the character limit with BAD_REQUEST', async () => {
        const names = ['a'.repeat(SKILL_ICON_MAX_CHARACTERS_PER_REQUEST), 'b'];

        await expect(caller.generateSkillIcons({ names })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it('rejects a single name over the character limit', async () => {
        const names = ['a'.repeat(SKILL_ICON_MAX_CHARACTERS_PER_REQUEST + 1)];

        await expect(caller.generateSkillIcons({ names })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
    });

    it('still rejects empty lists and empty names', async () => {
        await expect(caller.generateSkillIcons({ names: [] })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
        await expect(caller.generateSkillIcons({ names: [''] })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
    });
});
