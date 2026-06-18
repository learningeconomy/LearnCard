import { beforeEach, describe, expect, it } from 'vitest';

import {
    DEFAULT_ASSISTANT_AVATAR_CONFIG,
    getAssistantAvatarStorageKey,
    loadAssistantAvatarConfig,
    normalizeAssistantAvatarConfig,
    saveAssistantAvatarConfig,
} from './assistantAvatarOptions';

describe('assistantAvatarOptions', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('normalizes invalid config to defaults', () => {
        expect(
            normalizeAssistantAvatarConfig({ accessory: 'rocket', mouth: 'frown', animated: 'yes' })
        ).toEqual(DEFAULT_ASSISTANT_AVATAR_CONFIG);
    });

    it('keeps valid config values', () => {
        expect(
            normalizeAssistantAvatarConfig({ accessory: 'cat', mouth: 'whiskers', animated: false })
        ).toEqual({ accessory: 'cat', mouth: 'whiskers', animated: false });
    });

    it('preserves a supplied exact asset URI', () => {
        expect(
            normalizeAssistantAvatarConfig({
                accessory: 'cat',
                mouth: 'whiskers',
                animated: true,
                assetUri: '/assistant-avatar-sprites/cat-whiskers.svg',
            })
        ).toEqual({
            accessory: 'cat',
            mouth: 'whiskers',
            animated: true,
            assetUri: '/assistant-avatar-sprites/cat-whiskers.svg',
        });
    });

    it('saves avatar config per DID', () => {
        saveAssistantAvatarConfig(
            { accessory: 'crown', mouth: 'vampire', animated: false },
            'did:key:user'
        );

        expect(getAssistantAvatarStorageKey('did:key:user')).toBe(
            'learnCardAssistantAvatar:did:key:user'
        );
        expect(loadAssistantAvatarConfig('did:key:user')).toEqual({
            accessory: 'crown',
            mouth: 'vampire',
            animated: false,
        });
    });
});
