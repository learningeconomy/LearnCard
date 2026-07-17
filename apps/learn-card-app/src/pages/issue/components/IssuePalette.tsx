import React, { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Loader2, SlidersHorizontal, ChevronDown, X } from 'lucide-react';

import {
    useImageUpload,
    SelectInput,
    parseLcTags,
    buildLcTags,
    DisplayTypeEnum,
} from 'learn-card-base';
import type { LcDisplayHints } from 'learn-card-base';
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
import { AlignmentsShowcase } from './AlignmentsShowcase';
import { TypePicker } from './TypePicker';
import { StartFromExisting } from './StartFromExisting';
import { ActivityFields } from './ActivityFields';
import { TemplatableField } from './TemplatableField';
import type { CredentialTypeEntry } from './credentialTypeCatalog';
import type { ResolvedSkill } from './skillAlignment';
import type { NormalizedImport } from '../import/normalizeToObv3';
import type { SelectedSkill } from '../../skills/skillTypes';
import { staticField } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type {
    OBv3CredentialTemplate,
    TemplateFieldValue,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all';
const LABEL_CLASS = 'block text-xs font-medium text-grayscale-700 mb-1.5';
const CARD_CLASS = 'bg-white border border-grayscale-200 rounded-[20px] p-5';

const DISPLAY_TYPE_OPTIONS: {
    value: DisplayTypeEnum;
    displayText: string;
    description: string;
}[] = [
    {
        value: DisplayTypeEnum.Badge,
        displayText: 'Badge',
        description: 'A circular emblem with a ribbon. Best for social badges and achievements.',
    },
    {
        value: DisplayTypeEnum.Certificate,
        displayText: 'Certificate',
        description: 'A formal, document-style frame. Good for completions and certifications.',
    },
    {
        value: DisplayTypeEnum.Award,
        displayText: 'Award',
        description: 'A trophy-style ribbon that emphasizes recognition and honors.',
    },
    {
        value: DisplayTypeEnum.ID,
        displayText: 'ID card',
        description: 'A wallet-style ID layout with photo and issuer. Great for memberships.',
    },
    {
        value: DisplayTypeEnum.Course,
        displayText: 'Course',
        description: 'Tuned for courses, classes, and learning programs.',
    },
    {
        value: DisplayTypeEnum.Media,
        displayText: 'Media',
        description: 'A rich tile that showcases an image or video front-and-center.',
    },
];

const CATEGORY_OPTIONS: { value: string; displayText: string; description: string }[] = [
    {
        value: 'Social Badge',
        displayText: 'Badge',
        description: 'Community and social recognition badges.',
    },
    {
        value: 'Achievement',
        displayText: 'Achievement',
        description: 'Awards, certificates, and accomplishments.',
    },
    {
        value: 'Learning History',
        displayText: 'Course',
        description: 'Courses, classes, and learning programs.',
    },
    {
        value: 'Accomplishment',
        displayText: 'Portfolio',
        description: 'Portfolio pieces and personal work.',
    },
    {
        value: 'Accommodation',
        displayText: 'Assistance',
        description: 'Support needs and accommodations.',
    },
    {
        value: 'Work History',
        displayText: 'Experience',
        description: 'Jobs, internships, and professional experience.',
    },
    {
        value: 'ID',
        displayText: 'ID',
        description: 'Identity cards and official credentials.',
    },
];

const HEX_INPUT_REGEX = /[^0-9a-fA-F]/g;

const ColorField: React.FC<{
    label: string;
    value?: string;
    placeholder?: string;
    hint?: string;
    onChange: (hex: string | undefined) => void;
}> = ({ label, value, placeholder = '353E64', hint, onChange }) => {
    const [text, setText] = useState((value ?? '').replace(/^#/, ''));
    useEffect(() => setText((value ?? '').replace(/^#/, '')), [value]);

    const handleHex = (raw: string) => {
        const cleaned = raw.replace(HEX_INPUT_REGEX, '').slice(0, 8).toUpperCase();
        setText(cleaned);
        if ([3, 6, 8].includes(cleaned.length)) onChange(`#${cleaned}`);
        else if (cleaned.length === 0) onChange(undefined);
    };

    const swatch = /^#[0-9a-fA-F]{6}$/.test(value ?? '') ? (value as string) : '#FFFFFF';

    return (
        <div>
            <label className={LABEL_CLASS}>{label}</label>
            <div className="flex items-center gap-3">
                <label className="relative h-11 w-11 shrink-0 rounded-xl border border-grayscale-300 overflow-hidden cursor-pointer shadow-sm hover:ring-2 hover:ring-emerald-500 transition-all">
                    <span
                        className="absolute inset-0"
                        style={{ backgroundColor: value ?? '#FFFFFF' }}
                    />
                    <input
                        type="color"
                        value={swatch}
                        onChange={e => onChange(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </label>
                <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-grayscale-400 text-base pointer-events-none select-none">
                        #
                    </span>
                    <input
                        type="text"
                        value={text}
                        onChange={e => handleHex(e.target.value)}
                        placeholder={placeholder}
                        maxLength={8}
                        spellCheck={false}
                        className="w-full py-3 pl-8 pr-10 border border-grayscale-300 rounded-xl text-base text-grayscale-900 uppercase tracking-wide placeholder:text-grayscale-400 placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all"
                    />
                    {text && (
                        <button
                            type="button"
                            onClick={() => {
                                setText('');
                                onChange(undefined);
                            }}
                            aria-label={`Clear ${label.toLowerCase()}`}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-400 hover:text-grayscale-700 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
            {hint && <p className="mt-1.5 text-xs text-grayscale-400 leading-relaxed">{hint}</p>}
        </div>
    );
};

interface IssuePaletteProps {
    selectedType: CredentialTypeEntry | null;
    template: OBv3CredentialTemplate | null;
    onSelectType: (entry: CredentialTypeEntry) => void;
    onChangeTemplate: (template: OBv3CredentialTemplate) => void;
    onImport: (result: NormalizedImport) => void;
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
    onImport,
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

    const setNameField = (field: TemplateFieldValue) => {
        if (!template) return;
        onChangeTemplate({
            ...template,
            name: field,
            credentialSubject: {
                ...template.credentialSubject,
                achievement: { ...template.credentialSubject.achievement, name: field },
            },
        });
    };

    const canMakeDynamic = recipientMode === 'people' && recipients.length > 1;

    const { handleFileSelect, isLoading: imageUploading } = useImageUpload({
        fileType: 'image/*',
        resizeBeforeUploading: true,
        onUpload: (url: string) => patchAchievement({ image: staticField(url) }),
    });

    // Display hints are a projection of the OBv3 `achievement.tag` array (`lc:` convention); non-`lc:` tags are preserved on write.
    const hints = parseLcTags(ach?.tag);

    const setHints = useCallback(
        (patch: Partial<LcDisplayHints>) => {
            const nonLcTags = (ach?.tag ?? []).filter(t => !t.toLowerCase().startsWith('lc:'));
            patchAchievement({ tag: [...nonLcTags, ...buildLcTags({ ...hints, ...patch })] });
        },
        [ach, hints, patchAchievement]
    );

    const { handleFileSelect: handleBgSelect, isLoading: bgUploading } = useImageUpload({
        fileType: 'image/*',
        resizeBeforeUploading: true,
        onUpload: (url: string) => setHints({ backgroundImage: url }),
    });

    const name = ach?.name?.value ?? '';
    const nameInvalid = nameTouched && !ach?.name?.isDynamic && !name.trim();
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

    const handleRemoveAlignment = useCallback(
        (id: string) => {
            const remaining = (ach?.alignment ?? []).filter(a => a.id !== id);
            patchAchievement({ alignment: remaining.length > 0 ? remaining : undefined });
        },
        [ach, patchAchievement]
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
                <StartFromExisting onImport={onImport} />
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
                        <TemplatableField
                            label="Name"
                            field={ach?.name}
                            variableName="name"
                            canMakeDynamic={canMakeDynamic}
                            onChange={setNameField}
                            onBlur={() => setNameTouched(true)}
                            placeholder="e.g. Web Development Fundamentals"
                            errorText={
                                nameInvalid ? 'Give your credential a name to continue.' : undefined
                            }
                        />
                        <TemplatableField
                            label="Description (optional)"
                            field={ach?.description}
                            variableName="description"
                            canMakeDynamic={canMakeDynamic}
                            variant="textarea"
                            rows={3}
                            placeholder="What does this credential represent?"
                            onChange={field => patchAchievement({ description: field })}
                        />
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
                                canMakeDynamic={canMakeDynamic}
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

                    <AlignmentsShowcase
                        alignments={ach?.alignment ?? []}
                        onRemove={handleRemoveAlignment}
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
                                <TemplatableField
                                    label="How it’s earned (criteria)"
                                    field={ach?.criteria?.narrative}
                                    variableName="criteria"
                                    canMakeDynamic={canMakeDynamic}
                                    variant="textarea"
                                    rows={2}
                                    placeholder="Describe what the recipient did to earn this."
                                    onChange={field =>
                                        patchAchievement({
                                            criteria: {
                                                ...(ach?.criteria ?? {}),
                                                narrative: field,
                                            },
                                        })
                                    }
                                />
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

                                <div className="pt-4 mt-4 border-t border-grayscale-200 space-y-4">
                                    <h4 className="text-sm font-semibold text-grayscale-900">
                                        Display (optional)
                                    </h4>
                                    <p className="text-xs text-grayscale-400 leading-relaxed">
                                        Fine-tune how this credential looks. Wallets that don’t
                                        support these hints simply ignore them.
                                    </p>

                                    <div>
                                        <label className={LABEL_CLASS}>Category</label>
                                        <SelectInput
                                            value={hints.category ?? null}
                                            onChange={value =>
                                                setHints({
                                                    category: (value as string) || undefined,
                                                })
                                            }
                                            allowDeselect
                                            placeholder="Automatic (based on type)"
                                            options={CATEGORY_OPTIONS}
                                        />
                                    </div>

                                    <div>
                                        <label className={LABEL_CLASS}>Subtype label</label>
                                        <input
                                            type="text"
                                            value={hints.subtype ?? ''}
                                            onChange={e =>
                                                setHints({ subtype: e.target.value || undefined })
                                            }
                                            placeholder="e.g. Trailblazer"
                                            className={INPUT_CLASS}
                                        />
                                    </div>

                                    <div>
                                        <label className={LABEL_CLASS}>Display style</label>
                                        <SelectInput
                                            value={hints.displayType ?? null}
                                            onChange={value =>
                                                setHints({
                                                    displayType:
                                                        (value as DisplayTypeEnum) || undefined,
                                                })
                                            }
                                            allowDeselect
                                            placeholder="Automatic (based on type)"
                                            options={DISPLAY_TYPE_OPTIONS}
                                        />
                                    </div>

                                    <ColorField
                                        label="Background color"
                                        value={hints.backgroundColor}
                                        onChange={c => setHints({ backgroundColor: c })}
                                    />

                                    <ColorField
                                        label="Accent color (badge ring)"
                                        value={hints.accentColor}
                                        hint="Colors the badge ring. Defaults to the category color if unset."
                                        onChange={c => setHints({ accentColor: c })}
                                    />

                                    <div>
                                        <label className={LABEL_CLASS}>Background image</label>
                                        {hints.backgroundImage && (
                                            <div className="mb-2 flex items-center gap-3">
                                                <img
                                                    src={hints.backgroundImage}
                                                    alt="Background preview"
                                                    className="h-12 w-12 rounded-xl object-cover border border-grayscale-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setHints({ backgroundImage: undefined })
                                                    }
                                                    className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={e => handleBgSelect(e as any)}
                                            disabled={bgUploading}
                                            className="w-full py-3 px-4 rounded-xl border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                                        >
                                            {bgUploading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ImagePlus className="w-4 h-4" />
                                            )}
                                            {hints.backgroundImage
                                                ? 'Change background image'
                                                : 'Add a background image'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
};
