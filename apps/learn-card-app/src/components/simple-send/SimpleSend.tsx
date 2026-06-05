import React, { useCallback, useMemo, useState } from 'react';
import {
    Award,
    ScrollText,
    GraduationCap,
    Sparkles,
    Shield,
    Users,
    Zap,
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    ImagePlus,
    Loader2,
    SlidersHorizontal,
} from 'lucide-react';

import {
    useWallet,
    useToast,
    ToastTypeEnum,
    getLogger,
    useFilestack,
    BoostCategoryOptionsEnum,
    BoostPageViewMode,
} from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';

import {
    SimpleCredentialType,
    SimpleSendInput,
    SimpleSendRecipient,
    buildSimpleTemplate,
    issueAndSendCredential,
    issueAndSendSimpleCredential,
    isEmailRecipient,
} from './simpleSend.helpers';
import { validateCredentialJsonLd } from '../../pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/validateJsonLd';
import { CredentialBuilder } from '../../pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/CredentialBuilder';
import { templateToJson } from '../../pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import type { OBv3CredentialTemplate } from '../../pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { BoostEarnedCard } from '../boost/boost-earned-card/BoostEarnedCard';

const log = getLogger('simple-send-ui');

type Step = 'type' | 'details' | 'recipient' | 'advanced' | 'success';

interface TypeOption {
    type: SimpleCredentialType;
    label: string;
    blurb: string;
    Icon: React.FC<{ className?: string }>;
    accent: string;
}

const TYPE_OPTIONS: TypeOption[] = [
    {
        type: 'badge',
        label: 'Badge',
        blurb: 'A digital badge',
        Icon: Award,
        accent: 'bg-emerald-50 text-emerald-700',
    },
    {
        type: 'certificate',
        label: 'Certificate',
        blurb: 'A formal certificate',
        Icon: ScrollText,
        accent: 'bg-indigo-50 text-indigo-700',
    },
    {
        type: 'course',
        label: 'Course',
        blurb: 'Course completion',
        Icon: GraduationCap,
        accent: 'bg-emerald-50 text-emerald-700',
    },
    {
        type: 'skill',
        label: 'Skill',
        blurb: 'A competency',
        Icon: Sparkles,
        accent: 'bg-amber-50 text-amber-700',
    },
    {
        type: 'license',
        label: 'License',
        blurb: 'A professional license',
        Icon: Shield,
        accent: 'bg-indigo-50 text-indigo-700',
    },
    {
        type: 'membership',
        label: 'Membership',
        blurb: 'Group membership',
        Icon: Users,
        accent: 'bg-emerald-50 text-emerald-700',
    },
    {
        type: 'micro-credential',
        label: 'Micro-Credential',
        blurb: 'Short-form learning',
        Icon: Zap,
        accent: 'bg-amber-50 text-amber-700',
    },
];

const TYPE_LABEL: Record<SimpleCredentialType, string> = TYPE_OPTIONS.reduce(
    (acc, o) => ({ ...acc, [o.type]: o.label }),
    {} as Record<SimpleCredentialType, string>
);

export interface SimpleSendProps {
    onComplete?: (credentialUri: string) => void;
    onClose?: () => void;
}

export const SimpleSend: React.FC<SimpleSendProps> = ({ onComplete, onClose }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const [step, setStep] = useState<Step>('type');
    const [credentialType, setCredentialType] = useState<SimpleCredentialType | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [criteriaNarrative, setCriteriaNarrative] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const [recipientMode, setRecipientMode] = useState<'self' | 'other'>('self');
    const [recipientValue, setRecipientValue] = useState('');

    const [advancedTemplate, setAdvancedTemplate] = useState<OBv3CredentialTemplate | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { handleFileSelect, isLoading: imageUploading } = useFilestack({
        fileType: 'image/*',
        resizeBeforeUploading: true,
        onUpload: (url: string) => setImageUrl(url),
    });

    const draftInput = useMemo<SimpleSendInput | null>(() => {
        if (!credentialType) return null;
        return {
            credentialType,
            name: name.trim(),
            description: description.trim(),
            criteriaNarrative: criteriaNarrative.trim() || undefined,
            imageUrl: imageUrl || undefined,
        };
    }, [credentialType, name, description, criteriaNarrative, imageUrl]);

    const previewCredential = useMemo<Record<string, unknown> | null>(() => {
        const template = advancedTemplate ?? (draftInput ? buildSimpleTemplate(draftInput) : null);
        if (!template) return null;

        const json = templateToJson(template);
        const fill = (obj: unknown): unknown => {
            if (typeof obj === 'string') {
                return obj.replace(/\{\{(\w+)\}\}/g, (_m, v) =>
                    /date|time/i.test(v) ? new Date().toISOString() : ''
                );
            }
            if (Array.isArray(obj)) return obj.map(fill);
            if (obj && typeof obj === 'object') {
                return Object.fromEntries(Object.entries(obj).map(([k, val]) => [k, fill(val)]));
            }
            return obj;
        };
        return { ...(fill(json) as Record<string, unknown>), validFrom: new Date().toISOString() };
    }, [advancedTemplate, draftInput]);

    const detailsValid = Boolean(draftInput?.name && draftInput?.description);
    const recipientValid = recipientMode === 'self' || recipientValue.trim().length > 0;

    const handlePickType = useCallback((type: SimpleCredentialType) => {
        log.info('simple-send.flow.type_selected', { credentialType: type });
        setCredentialType(type);
        setStep('details');
    }, []);

    const openAdvanced = useCallback(() => {
        log.info('simple-send.flow.advanced_opened', { credentialType: credentialType ?? null });
        if (draftInput) setAdvancedTemplate(buildSimpleTemplate(draftInput));
        setStep('advanced');
    }, [credentialType, draftInput]);

    const handleSubmit = useCallback(async () => {
        if (!draftInput && !advancedTemplate) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const wallet = await initWallet();

            const templateForValidation = advancedTemplate ?? buildSimpleTemplate(draftInput!);
            const jsonLd = await validateCredentialJsonLd(templateToJson(templateForValidation));
            if (!jsonLd.valid) {
                setError(jsonLd.errors.join('; '));
                setIsSubmitting(false);
                return;
            }

            const recipient: SimpleSendRecipient =
                recipientMode === 'self'
                    ? { kind: 'self' }
                    : { kind: 'identifier', value: recipientValue.trim() };

            const result = advancedTemplate
                ? await issueAndSendCredential(wallet, advancedTemplate, recipient)
                : await issueAndSendSimpleCredential(wallet, draftInput!, recipient);

            const sentToEmail = recipientMode === 'other' && isEmailRecipient(recipientValue);
            presentToast(
                sentToEmail
                    ? 'Credential sent — they’ll get an email to claim it.'
                    : 'Credential issued.',
                { type: ToastTypeEnum.Success, hasDismissButton: true }
            );

            setStep('success');
            onComplete?.(result.credentialUri);
        } catch (e) {
            log.error('simple-send.submit.failed', e);
            const message = (e as Error)?.message ?? '';
            setError(
                /network|fetch|connection/i.test(message)
                    ? 'Connection issue. Please check your internet and try again.'
                    : 'Something went wrong issuing your credential. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }, [
        draftInput,
        advancedTemplate,
        credentialType,
        initWallet,
        recipientMode,
        recipientValue,
        presentToast,
        onComplete,
    ]);

    const goBack = useCallback(() => {
        if (step === 'recipient') setStep('details');
        else if (step === 'advanced') setStep('details');
        else setStep('type');
    }, [step]);

    return (
        <div className="font-poppins w-full max-w-[480px] mx-auto p-6 animate-fade-in-up">
            {step !== 'type' && step !== 'success' && (
                <button
                    type="button"
                    onClick={goBack}
                    className="flex items-center gap-1 mb-4 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            )}

            {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl">
                    <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                </div>
            )}

            {step === 'type' && (
                <div className="space-y-5">
                    <div>
                        <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                            What are you issuing?
                        </h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Choose a type to get started.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {TYPE_OPTIONS.map(({ type, label, blurb, Icon, accent }) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => handlePickType(type)}
                                className="flex flex-col items-start gap-2 p-4 rounded-[20px] border border-grayscale-200 text-left hover:bg-grayscale-10 hover:border-grayscale-300 transition-colors"
                            >
                                <span
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${accent}`}
                                >
                                    <Icon className="w-5 h-5" />
                                </span>
                                <span className="text-sm font-medium text-grayscale-900">
                                    {label}
                                </span>
                                <span className="text-xs text-grayscale-500 leading-relaxed">
                                    {blurb}
                                </span>
                            </button>
                        ))}
                    </div>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            )}

            {step === 'details' && credentialType && (
                <div className="space-y-5">
                    <div>
                        <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                            {TYPE_LABEL[credentialType]} details
                        </h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Just the essentials. You can add more later.
                        </p>
                    </div>

                    {previewCredential && (
                        <div className="flex justify-center py-2">
                            <div className="w-[170px]">
                                <BoostEarnedCard
                                    credential={previewCredential as any}
                                    categoryType={
                                        getDefaultCategoryForCredential(previewCredential as any) ||
                                        BoostCategoryOptionsEnum.achievement
                                    }
                                    boostPageViewMode={BoostPageViewMode.Card}
                                    useWrapper={false}
                                    verifierState={false}
                                    className="shadow-lg"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Web Development Fundamentals"
                                className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="What does this credential represent?"
                                rows={3}
                                className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white resize-none"
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
                            {imageUrl ? 'Change image' : 'Add an image (optional)'}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setStep('recipient')}
                        disabled={!detailsValid}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                        Continue
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={openAdvanced}
                        className="w-full flex items-center justify-center gap-1.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Add more detail (criteria, dates, evidence)
                    </button>
                </div>
            )}

            {step === 'advanced' && advancedTemplate && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                            Advanced details
                        </h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Still a standards-compliant credential — just with more fields.
                        </p>
                    </div>

                    <div className="border border-grayscale-200 rounded-[20px] overflow-hidden h-[420px]">
                        <CredentialBuilder
                            template={advancedTemplate}
                            onChange={setAdvancedTemplate}
                            hideRecipientSection
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setStep('recipient')}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                    >
                        Continue
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {step === 'recipient' && (
                <div className="space-y-5">
                    <div>
                        <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                            Who is this for?
                        </h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Issue to yourself, or send to someone else.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setRecipientMode('self')}
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
                            onClick={() => setRecipientMode('other')}
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
                            <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                Email or username
                            </label>
                            <input
                                type="text"
                                value={recipientValue}
                                onChange={e => setRecipientValue(e.target.value)}
                                placeholder="name@example.com or @username"
                                className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                            />
                            <p className="mt-1.5 text-xs text-grayscale-400">
                                If it’s an email, they’ll get a link to claim it.
                            </p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!recipientValid || isSubmitting}
                        className="w-full py-3 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Issuing...
                            </span>
                        ) : (
                            'Issue Credential'
                        )}
                    </button>
                </div>
            )}

            {step === 'success' && (
                <div className="text-center space-y-5 py-4">
                    <div className="flex justify-center">
                        <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-grayscale-900 mb-1">All done</h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Your credential was issued successfully.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
};

export default SimpleSend;
