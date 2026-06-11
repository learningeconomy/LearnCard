import React, { useCallback, useState } from 'react';
import { ImagePlus, Loader2, SlidersHorizontal, ChevronDown } from 'lucide-react';

import { useFilestack } from 'learn-card-base';
import { isPlausibleRecipient } from './recipientValidation';
import { RecipientPicker } from './RecipientPicker';
import { RecipientMode, Recipient, LinkOptions } from './recipientTypes';
import {
    MediaAttachments,
    type SimpleMediaAttachment,
    type SimpleMediaType,
} from './MediaAttachments';
import { mediaToEvidenceTemplates } from './mediaEvidence';
import { SkillsSection } from './SkillsSection';
import { TypePicker } from './TypePicker';
import { ActivityFields } from './ActivityFields';
import type { CredentialTypeEntry } from './credentialTypeCatalog';
import type { ResolvedSkill } from './skillAlignment';
import type { SelectedSkill } from '../../skills/skillTypes';
import { staticField } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type { OBv3CredentialTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all';
const LABEL_CLASS = 'block text-xs font-medium text-grayscale-700 mb-1.5';
const CARD_CLASS = 'bg-white border border-grayscale-200 rounded-[20px] p-5';

interface IssuePaletteProps {
    selectedType: CredentialTypeEntry | null;
    template: OBv3CredentialTemplate | null;
    onSelectType: (entry: CredentialTypeEntry) => void;
    onChangeTemplate: (template: OBv3CredentialTemplate) => void;
    recipientMode: RecipientMode;
    recipients: Recipient[];
    linkOptions: LinkOptions;
    onRecipientModeChange: (mode: RecipientMode) => void;
    onRecipientsChange: (recipients: Recipient[]) => void;
    onLinkOptionsChange: (options: LinkOptions) => void;
    selectedSkills: SelectedSkill[];
    resolvedSkills: ResolvedSkill[];
    onSelectedSkillsChange: (skills: SelectedSkill[]) => void;
    onResolvedSkillsChange: (resolved: ResolvedSkill[]) => void;
}

export const IssuePalette: React.FC<IssuePaletteProps> = ({
    selectedType,
    template,
    onSelectType,
    onChangeTemplate,
    recipientMode,
    recipients,
    linkOptions,
    onRecipientModeChange,
    onRecipientsChange,
    onLinkOptionsChange,
    selectedSkills,
    resolvedSkills,
    onSelectedSkillsChange,
    onResolvedSkillsChange,
}) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [recipientTouched, setRecipientTouched] = useState(false);
    const [nameTouched, setNameTouched] = useState(false);

    const ach = template?.credentialSubject?.achievement;

    const patchAchievement = useCallback(
        (patch: Partial<NonNullable<typeof ach>>) => {
            if (!template) return;
            onChangeTemplate({
                ...template,
                credentialSubject: {
                    ...template.credentialSubject,
                    achievement: { ...template.credentialSubject.achievement, ...patch },
                },
            });
        },
        [template, onChangeTemplate]
    );

    const setName = (value: string) => {
        if (!template) return;
        onChangeTemplate({
            ...template,
            name: staticField(value),
            credentialSubject: {
                ...template.credentialSubject,
                achievement: {
                    ...template.credentialSubject.achievement,
                    name: staticField(value),
                },
            },
        });
    };

    const { handleFileSelect, isLoading: imageUploading } = useFilestack({
        fileType: 'image/*',
        resizeBeforeUploading: true,
        onUpload: (url: string) => patchAchievement({ image: staticField(url) }),
    });

    const name = ach?.name?.value ?? '';
    const nameInvalid = nameTouched && !name.trim();
    const description = ach?.description?.value ?? '';
    const hasImage = Boolean(ach?.image?.value);

    const mediaAttachments: SimpleMediaAttachment[] = (template?.credentialSubject?.evidence ?? [])
        .filter(e => e.evidenceUrl?.value)
        .map(e => ({
            id: e.id,
            type: (e.genre?.value as SimpleMediaType) || 'link',
            url: e.evidenceUrl?.value ?? '',
            title: e.name?.value ?? '',
        }));

    const handleMediaChange = useCallback(
        (next: SimpleMediaAttachment[]) => {
            if (!template) return;
            onChangeTemplate({
                ...template,
                credentialSubject: {
                    ...template.credentialSubject,
                    evidence: mediaToEvidenceTemplates(next),
                },
            });
        },
        [template, onChangeTemplate]
    );

    return (
        <div className="space-y-5 animate-fade-in-up">
            <section className={CARD_CLASS}>
                <h2 className="text-base font-semibold text-grayscale-900 mb-1">
                    What are you issuing?
                </h2>
                <p className="text-sm text-grayscale-600 leading-relaxed mb-4">
                    Pick a type—your credential takes shape as you go.
                </p>
                <TypePicker
                    selectedObv3Type={selectedType?.obv3Type ?? null}
                    onSelectType={onSelectType}
                />
            </section>

            {template && (
                <>
                    <section className={`${CARD_CLASS} space-y-4`}>
                        <RecipientPicker
                            mode={recipientMode}
                            onModeChange={onRecipientModeChange}
                            recipients={recipients}
                            onRecipientsChange={onRecipientsChange}
                            linkOptions={linkOptions}
                            onLinkOptionsChange={onLinkOptionsChange}
                        />
                    </section>

                    <section className={`${CARD_CLASS} space-y-4`}>
                        <h3 className="text-base font-semibold text-grayscale-900">Details</h3>
                        <div>
                            <label className={LABEL_CLASS}>Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onBlur={() => setNameTouched(true)}
                                placeholder="e.g. Web Development Fundamentals"
                                className={`${INPUT_CLASS} ${
                                    nameInvalid ? '!border-red-400 focus:!ring-red-500' : ''
                                }`}
                            />
                            {nameInvalid && (
                                <p className="mt-1.5 text-xs text-red-600">
                                    Give your credential a name to continue.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Description (optional)</label>
                            <textarea
                                value={description}
                                onChange={e =>
                                    patchAchievement({ description: staticField(e.target.value) })
                                }
                                placeholder="What does this credential represent?"
                                rows={3}
                                className={`${INPUT_CLASS} resize-none`}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={e => handleFileSelect(e as any)}
                            disabled={imageUploading}
                            className="w-full py-3 px-4 rounded-xl border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            {imageUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ImagePlus className="w-4 h-4" />
                            )}
                            {hasImage ? 'Change image' : 'Add an image (optional)'}
                        </button>

                        {selectedType && selectedType.activityFields.length > 0 && (
                            <ActivityFields
                                fields={selectedType.activityFields}
                                template={template}
                                onChangeTemplate={onChangeTemplate}
                            />
                        )}
                    </section>

                    <MediaAttachments attachments={mediaAttachments} onChange={handleMediaChange} />

                    <SkillsSection
                        selectedSkills={selectedSkills}
                        resolvedSkills={resolvedSkills}
                        onSelectedSkillsChange={onSelectedSkillsChange}
                        onResolvedSkillsChange={onResolvedSkillsChange}
                    />

                    <section className={CARD_CLASS}>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(v => !v)}
                            className="w-full flex items-center justify-between text-sm font-medium text-grayscale-700 hover:text-grayscale-900 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4" />
                                More detail
                            </span>
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                    showAdvanced ? 'rotate-180' : ''
                                }`}
                            />
                        </button>

                        {showAdvanced && (
                            <div className="pt-5 mt-5 border-t border-grayscale-200 space-y-4 animate-fade-in-up">
                                <div>
                                    <label className={LABEL_CLASS}>
                                        How it’s earned (criteria)
                                    </label>
                                    <textarea
                                        value={ach?.criteria?.narrative?.value ?? ''}
                                        onChange={e =>
                                            patchAchievement({
                                                criteria: {
                                                    ...(ach?.criteria ?? {}),
                                                    narrative: staticField(e.target.value),
                                                },
                                            })
                                        }
                                        placeholder="Describe what the recipient did to earn this."
                                        rows={2}
                                        className={`${INPUT_CLASS} resize-none`}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLASS}>Expires on (optional)</label>
                                    <input
                                        type="date"
                                        value={(template.validUntil?.value ?? '').slice(0, 10)}
                                        onChange={e =>
                                            onChangeTemplate({
                                                ...template,
                                                validUntil: e.target.value
                                                    ? staticField(
                                                          new Date(e.target.value).toISOString()
                                                      )
                                                    : staticField(''),
                                            })
                                        }
                                        className={INPUT_CLASS}
                                    />
                                </div>
                                <p className="text-xs text-grayscale-400 leading-relaxed">
                                    Add evidence and media above in the
                                    <span className="font-medium text-grayscale-600">
                                        {' '}
                                        Evidence &amp; media{' '}
                                    </span>
                                    section.
                                </p>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
};
