export type AssistantAvatarAccessory =
    | 'none'
    | 'long-hair'
    | 'short-hair'
    | 'cat'
    | 'bear'
    | 'unicorn'
    | 'bunny'
    | 'cowboy'
    | 'chef'
    | 'pinwheel'
    | 'side-cap'
    | 'front-cap'
    | 'crown'
    | 'bandana';

export type AssistantAvatarMouth =
    | 'smile'
    | 'mustache'
    | 'vampire'
    | 'whiskers'
    | 'short-snout'
    | 'long-snout';

export interface AssistantAvatarConfig {
    accessory: AssistantAvatarAccessory;
    mouth: AssistantAvatarMouth;
    animated: boolean;
    assetUri?: string;
}

export const DEFAULT_ASSISTANT_AVATAR_CONFIG: AssistantAvatarConfig = {
    accessory: 'none',
    mouth: 'smile',
    animated: true,
};

export const ASSISTANT_AVATAR_ACCESSORIES: Array<{
    id: AssistantAvatarAccessory;
    label: string;
}> = [
    { id: 'none', label: 'None' },
    { id: 'long-hair', label: 'Long hair' },
    { id: 'short-hair', label: 'Short hair' },
    { id: 'cat', label: 'Cat' },
    { id: 'bear', label: 'Bear' },
    { id: 'unicorn', label: 'Unicorn' },
    { id: 'bunny', label: 'Bunny' },
    { id: 'cowboy', label: 'Cowboy' },
    { id: 'chef', label: 'Chef' },
    { id: 'pinwheel', label: 'Pinwheel' },
    { id: 'side-cap', label: 'Side cap' },
    { id: 'front-cap', label: 'Front cap' },
    { id: 'crown', label: 'Crown' },
    { id: 'bandana', label: 'Bandana' },
];

export const ASSISTANT_AVATAR_MOUTHS: Array<{ id: AssistantAvatarMouth; label: string }> = [
    { id: 'smile', label: 'Smile' },
    { id: 'mustache', label: 'Mustache' },
    { id: 'vampire', label: 'Vampire' },
    { id: 'whiskers', label: 'Whiskers' },
    { id: 'short-snout', label: 'Short snout' },
    { id: 'long-snout', label: 'Long snout' },
];

const STORAGE_KEY_PREFIX = 'learnCardAssistantAvatar';

const isAssistantAvatarAccessory = (value: unknown): value is AssistantAvatarAccessory =>
    ASSISTANT_AVATAR_ACCESSORIES.some(option => option.id === value);

const isAssistantAvatarMouth = (value: unknown): value is AssistantAvatarMouth =>
    ASSISTANT_AVATAR_MOUTHS.some(option => option.id === value);

export const getAssistantAvatarStorageKey = (did?: string): string =>
    did ? `${STORAGE_KEY_PREFIX}:${did}` : STORAGE_KEY_PREFIX;

export const normalizeAssistantAvatarConfig = (value: unknown): AssistantAvatarConfig => {
    if (!value || typeof value !== 'object') return DEFAULT_ASSISTANT_AVATAR_CONFIG;

    const candidate = value as Partial<AssistantAvatarConfig>;

    return {
        accessory: isAssistantAvatarAccessory(candidate.accessory)
            ? candidate.accessory
            : DEFAULT_ASSISTANT_AVATAR_CONFIG.accessory,
        mouth: isAssistantAvatarMouth(candidate.mouth)
            ? candidate.mouth
            : DEFAULT_ASSISTANT_AVATAR_CONFIG.mouth,
        animated:
            typeof candidate.animated === 'boolean'
                ? candidate.animated
                : DEFAULT_ASSISTANT_AVATAR_CONFIG.animated,
        ...(typeof candidate.assetUri === 'string' && candidate.assetUri.trim()
            ? { assetUri: candidate.assetUri.trim() }
            : {}),
    };
};

export const loadAssistantAvatarConfig = (did?: string): AssistantAvatarConfig => {
    try {
        const raw = localStorage.getItem(getAssistantAvatarStorageKey(did));

        return raw
            ? normalizeAssistantAvatarConfig(JSON.parse(raw))
            : DEFAULT_ASSISTANT_AVATAR_CONFIG;
    } catch {
        return DEFAULT_ASSISTANT_AVATAR_CONFIG;
    }
};

export const saveAssistantAvatarConfig = (config: AssistantAvatarConfig, did?: string): void => {
    try {
        localStorage.setItem(
            getAssistantAvatarStorageKey(did),
            JSON.stringify(normalizeAssistantAvatarConfig(config))
        );
    } catch {
        // Local persistence is best-effort; the builder still works for the current session.
    }
};
