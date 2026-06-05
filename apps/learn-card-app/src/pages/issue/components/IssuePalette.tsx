import React, { useCallback, useState } from 'react';
import {
    Award,
    ScrollText,
    GraduationCap,
    Sparkles,
    Shield,
    Users,
    Zap,
    ImagePlus,
    Loader2,
    SlidersHorizontal,
    ChevronDown,
} from 'lucide-react';

import { useFilestack } from 'learn-card-base';
import {
    SimpleCredentialType,
    isEmailRecipient,
} from '../../../components/simple-send/simpleSend.helpers';
import { isPlausibleRecipient } from './recipientValidation';
import { staticField } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type { OBv3CredentialTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

interface TypeOption {
    type: SimpleCredentialType;
    label: string;
    Icon: React.FC<{ className?: string }>;
    hoverAccent: string;
}

const TYPE_OPTIONS: TypeOption[] = [
    {
        type: 'badge',
        label: 'Badge',
        Icon: Award,
        hoverAccent: 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700',
    },
    {
        type: 'certificate',
        label: 'Certificate',
        Icon: ScrollText,
        hoverAccent: 'hover:border-grayscale-400 hover:bg-grayscale-10 hover:text-grayscale-900',
    },
    {
        type: 'course',
        label: 'Course',
        Icon: GraduationCap,
        hoverAccent: 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700',
    },
    {
        type: 'skill',
        label: 'Skill',
        Icon: Sparkles,
        hoverAccent: 'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700',
    },
    {
        type: 'license',
        label: 'License',
        Icon: Shield,
        hoverAccent: 'hover:border-grayscale-400 hover:bg-grayscale-10 hover:text-grayscale-900',
    },
    {
        type: 'membership',
        label: 'Membership',
        Icon: Users,
        hoverAccent: 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700',
    },
    {
        type: 'micro-credential',
        label: 'Micro-Credential',
        Icon: Zap,
        hoverAccent: 'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700',
    },
];

const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all';
const LABEL_CLASS = 'block text-xs font-medium text-grayscale-700 mb-1.5';
const CARD_CLASS = 'bg-white border border-grayscale-200 rounded-[20px] p-5';

interface IssuePaletteProps {
    credentialType: SimpleCredentialType | null;
    template: OBv3CredentialTemplate | null;
    onSelectType: (type: SimpleCredentialType) => void;
    onChangeTemplate: (template: OBv3CredentialTemplate) => void;
    recipientMode: 'self' | 'other';
    recipientValue: string;
    onRecipientModeChange: (mode: 'self' | 'other') => void;
    onRecipientValueChange: (value: string) => void;
}

export const IssuePalette: React.FC<IssuePaletteProps> = ({
    credentialType,
    template,
    onSelectType,
    onChangeTemplate,
    recipientMode,
    recipientValue,
    onRecipientModeChange,
    onRecipientValueChange,
}) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [recipientTouched, setRecipientTouched] = useState(false);

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
    const description = ach?.description?.value ?? '';
    const hasImage = Boolean(ach?.image?.value);

    return (
        <div className="space-y-5 animate-fade-in-up">
            <section className={CARD_CLASS}>
                <h2 className="text-base font-semibold text-grayscale-900 mb-1">
                    What are you issuing?
                </h2>
                <p className="text-sm text-grayscale-600 leading-relaxed mb-4">
                    Pick a type — your credential takes shape as you go.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TYPE_OPTIONS.map(({ type, label, Icon, hoverAccent }) => {
                        const active = credentialType === type;
                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => onSelectType(type)}
                                className={`flex items-center gap-2 py-2.5 px-3 rounded-full border text-sm font-medium transition-all duration-200 ${
                                    active
                                        ? 'bg-grayscale-900 border-grayscale-900 text-white'
                                        : `bg-white border-grayscale-300 text-grayscale-700 motion-safe:hover:-translate-y-0.5 ${hoverAccent}`
                                }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span className="truncate">{label}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {template && (
                <>
                    <section className={`${CARD_CLASS} space-y-4`}>
                        <h3 className="text-base font-semibold text-grayscale-900">Details</h3>
                        <div>
                            <label className={LABEL_CLASS}>Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Web Development Fundamentals"
                                className={INPUT_CLASS}
                            />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Description</label>
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
                    </section>

                    <section className={CARD_CLASS}>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(v => !v)}
                            className="w-full flex items-center justify-between text-sm font-medium text-grayscale-700 hover:text-grayscale-900 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4" />
                                More detail (criteria, dates, evidence)
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
                                <div>
                                    <label className={LABEL_CLASS}>Evidence URL (optional)</label>
                                    <input
                                        type="url"
                                        value={
                                            template.credentialSubject.evidence?.[0]?.evidenceUrl
                                                ?.value ?? ''
                                        }
                                        onChange={e =>
                                            onChangeTemplate({
                                                ...template,
                                                credentialSubject: {
                                                    ...template.credentialSubject,
                                                    evidence: e.target.value
                                                        ? [
                                                              {
                                                                  id: 'evidence_0',
                                                                  evidenceUrl: staticField(
                                                                      e.target.value
                                                                  ),
                                                              },
                                                          ]
                                                        : [],
                                                },
                                            })
                                        }
                                        placeholder="https://example.com/proof"
                                        className={INPUT_CLASS}
                                    />
                                </div>
                            </div>
                        )}
                    </section>

                    <section className={`${CARD_CLASS} space-y-4`}>
                        <h3 className="text-base font-semibold text-grayscale-900">
                            Who is this for?
                        </h3>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setRecipientTouched(false);
                                    onRecipientModeChange('self');
                                }}
                                className={`flex-1 py-2.5 px-3 rounded-full font-medium text-sm transition-colors ${
                                    recipientMode === 'self'
                                        ? 'bg-grayscale-900 text-white'
                                        : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                }`}
                            >
                                Myself
                            </button>
                            <button
                                type="button"
                                onClick={() => onRecipientModeChange('other')}
                                className={`flex-1 py-2.5 px-3 rounded-full font-medium text-sm transition-colors ${
                                    recipientMode === 'other'
                                        ? 'bg-grayscale-900 text-white'
                                        : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                }`}
                            >
                                Someone else
                            </button>
                        </div>
                        {recipientMode === 'other' && (
                            <div>
                                <label className={LABEL_CLASS}>Email or username</label>
                                <input
                                    type="text"
                                    value={recipientValue}
                                    onChange={e => onRecipientValueChange(e.target.value)}
                                    onBlur={() => setRecipientTouched(true)}
                                    placeholder="name@example.com or @username"
                                    className={INPUT_CLASS}
                                />
                                {recipientValue && isEmailRecipient(recipientValue) ? (
                                    <p className="mt-1.5 text-xs text-grayscale-400">
                                        They’ll get a link to claim it.
                                    </p>
                                ) : recipientTouched &&
                                  recipientValue.trim() &&
                                  !isPlausibleRecipient(recipientValue) ? (
                                    <p className="mt-1.5 text-xs text-amber-600">
                                        Enter an email or @username.
                                    </p>
                                ) : (
                                    <p className="mt-1.5 text-xs text-grayscale-400">
                                        Enter an email or @username.
                                    </p>
                                )}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
};
