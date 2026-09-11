import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { createOutline, hardwareChipOutline, pencilOutline, settingsOutline } from 'ionicons/icons';

import AssistantAvatar from './AssistantAvatar';
import type { LearnCardAssistantProfile } from './learnCardAssistant.api';
import {
    ASSISTANT_AVATAR_ACCESSORIES,
    ASSISTANT_AVATAR_MOUTHS,
    type AssistantAvatarConfig,
} from './assistantAvatarOptions';

const DEFAULT_PROFILE: Pick<LearnCardAssistantProfile, 'name' | 'personality'> = {
    name: 'My Assistant',
    personality: 'Encouraging, practical, and focused on helping you grow your career.',
};

export const AssistantProfileCard: React.FC<{
    profile?: LearnCardAssistantProfile;
    avatarConfig: AssistantAvatarConfig;
    disabled: boolean;
    isSaving: boolean;
    isLoadingConsent: boolean;
    onSave: (input: { name: string; personality: string }) => Promise<void>;
    onAvatarChange: (config: AssistantAvatarConfig) => void;
    onOpenChat: () => void;
    onOpenMemories: () => void;
    onOpenConsent: () => Promise<void>;
}> = ({
    profile,
    avatarConfig,
    disabled,
    isSaving,
    isLoadingConsent,
    onSave,
    onAvatarChange,
    onOpenChat,
    onOpenMemories,
    onOpenConsent,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(profile?.name ?? DEFAULT_PROFILE.name);
    const [personality, setPersonality] = useState(
        profile?.personality ?? DEFAULT_PROFILE.personality
    );

    useEffect(() => {
        setName(profile?.name ?? DEFAULT_PROFILE.name);
        setPersonality(profile?.personality ?? DEFAULT_PROFILE.personality);
    }, [profile?.name, profile?.personality]);

    const cancelEdit = (): void => {
        setName(profile?.name ?? DEFAULT_PROFILE.name);
        setPersonality(profile?.personality ?? DEFAULT_PROFILE.personality);
        setIsEditing(false);
    };

    const save = async (): Promise<void> => {
        await onSave({ name, personality });
        setIsEditing(false);
    };

    return (
        <section className="bg-white border border-grayscale-200 rounded-[20px] p-7 shadow-bottom-2-4">
            {isEditing ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                            Assistant name
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={event => setName(event.target.value)}
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                            Personality
                        </label>

                        <textarea
                            value={personality}
                            onChange={event => setPersonality(event.target.value)}
                            rows={3}
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white resize-y"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-5 rounded-[20px] border border-grayscale-200 bg-grayscale-10 p-4">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <AssistantAvatar config={avatarConfig} size="lg" />

                            <button
                                type="button"
                                onClick={() =>
                                    onAvatarChange({
                                        ...avatarConfig,
                                        animated: !avatarConfig.animated,
                                    })
                                }
                                className={`py-2.5 px-4 rounded-[20px] border font-medium text-sm transition-colors ${
                                    avatarConfig.animated
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                        : 'bg-white border-grayscale-300 text-grayscale-700 hover:bg-grayscale-10'
                                }`}
                            >
                                {avatarConfig.animated ? 'Animation on' : 'Animation off'}
                            </button>
                        </div>

                        <div className="min-w-0 space-y-4">
                            <div>
                                <p className="text-xs font-medium text-grayscale-700 mb-2">
                                    Accessory
                                </p>

                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {ASSISTANT_AVATAR_ACCESSORIES.map(option => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() =>
                                                onAvatarChange({
                                                    ...avatarConfig,
                                                    accessory: option.id,
                                                })
                                            }
                                            className={`shrink-0 w-[82px] rounded-[20px] border p-2 text-center transition-colors ${
                                                avatarConfig.accessory === option.id
                                                    ? 'border-emerald-300 ring-1 ring-emerald-100 bg-emerald-50'
                                                    : 'border-grayscale-200 bg-white hover:bg-grayscale-10'
                                            }`}
                                        >
                                            <AssistantAvatar
                                                config={{ ...avatarConfig, accessory: option.id }}
                                                size="sm"
                                                className="mx-auto mb-1"
                                            />
                                            <span className="block truncate text-[11px] font-medium text-grayscale-700">
                                                {option.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-grayscale-700 mb-2">Mouth</p>

                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {ASSISTANT_AVATAR_MOUTHS.map(option => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() =>
                                                onAvatarChange({
                                                    ...avatarConfig,
                                                    mouth: option.id,
                                                })
                                            }
                                            className={`shrink-0 w-[82px] rounded-[20px] border p-2 text-center transition-colors ${
                                                avatarConfig.mouth === option.id
                                                    ? 'border-emerald-300 ring-1 ring-emerald-100 bg-emerald-50'
                                                    : 'border-grayscale-200 bg-white hover:bg-grayscale-10'
                                            }`}
                                        >
                                            <AssistantAvatar
                                                config={{ ...avatarConfig, mouth: option.id }}
                                                size="sm"
                                                className="mx-auto mb-1"
                                            />
                                            <span className="block truncate text-[11px] font-medium text-grayscale-700">
                                                {option.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => void save()}
                            disabled={isSaving || disabled || !name.trim() || !personality.trim()}
                            className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                'Save'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={isSaving}
                            className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-[170px_1fr] md:items-center">
                    <AssistantAvatar className="mx-auto md:mx-0" config={avatarConfig} size="lg" />

                    <div className="min-w-0 space-y-5">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-semibold text-grayscale-900 break-words">
                                    {profile?.name ?? DEFAULT_PROFILE.name}
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    disabled={disabled}
                                    className="shrink-0 p-2 rounded-full text-grayscale-500 hover:text-grayscale-900 hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Edit assistant profile"
                                >
                                    <IonIcon icon={pencilOutline} className="text-base" />
                                </button>
                            </div>

                            <p className="text-sm text-grayscale-600 leading-relaxed mt-1">
                                {profile?.personality ?? DEFAULT_PROFILE.personality}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-grayscale-500">
                            <span className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Connected to your profile
                            </span>
                            <span className="h-4 w-px bg-grayscale-200" />
                            <span>Last active today</span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.7fr_1.2fr]">
                            <button
                                type="button"
                                onClick={onOpenMemories}
                                disabled={disabled}
                                className="flex items-center justify-center gap-2 py-4 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-800 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <IonIcon icon={hardwareChipOutline} className="text-xl" />
                                Memories
                            </button>

                            <button
                                type="button"
                                onClick={onOpenChat}
                                className="flex items-center justify-center gap-2 py-4 px-4 rounded-[20px] bg-grayscale-900 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <IonIcon icon={createOutline} className="text-xl" />
                                Chat
                            </button>

                            <button
                                type="button"
                                onClick={() => void onOpenConsent()}
                                disabled={disabled || isLoadingConsent}
                                className="flex items-center justify-center gap-2 py-4 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-800 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isLoadingConsent ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <IonIcon icon={settingsOutline} className="text-xl" />
                                        Consent Flow
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default AssistantProfileCard;
