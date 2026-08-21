import React, { useState, useMemo } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import {
    flashOutline,
    checkmarkOutline,
    copyOutline,
    chevronDownOutline,
    chevronUpOutline,
    closeOutline,
    checkmarkCircleOutline,
} from 'ionicons/icons';
import { WALLET_CATEGORIES, PERSONAL_FIELDS } from '@learncard/partner-connect-core';
import type {
    ConsentRequest,
    WalletCategory,
    PersonalField,
} from '@learncard/partner-connect-core';

interface ConsentDesignerCardProps {
    appName: string;
    onEnable: (scopes: ConsentRequest) => Promise<void>;
    onDismiss: () => void;
    enabledScopes?: ConsentRequest | null;
}

const CATEGORY_DESCRIPTIONS: Record<WalletCategory, string> = {
    'Achievement': "Badges and awards they've earned",
    'Skill': "Skills they've built",
    'ID': 'IDs and memberships cards',
    'Learning History': 'Courses and learning records',
    'Work History': 'Jobs and work experience',
    'Social Badges': 'Community and social badges',
    'Membership': 'Group and club memberships',
    'Accomplishment': 'Notable accomplishments',
    'Experiences': 'Life and work experiences',
    'Accommodation': 'Special accommodations',
    'Family': 'Family and dependent records',
};

const PERSONAL_FIELD_LABELS: Record<PersonalField, string> = {
    'name': 'Name',
    'email': 'Email',
    'phone': 'Phone',
    'birthDate': 'Birth date',
    'country': 'Country',
    'avatar': 'Profile photo',
};

export const ConsentDesignerCard: React.FC<ConsentDesignerCardProps> = ({
    appName,
    onEnable,
    onDismiss,
    enabledScopes,
}) => {
    const [readCategories, setReadCategories] = useState<Set<WalletCategory>>(
        new Set(enabledScopes?.read?.credentialCategories || [])
    );
    const [readFields, setReadFields] = useState<Set<PersonalField>>(
        new Set(enabledScopes?.read?.personalFields || [])
    );
    const [writeCategories, setWriteCategories] = useState<Set<WalletCategory>>(
        new Set(enabledScopes?.write?.credentialCategories || [])
    );
    const [reason, setReason] = useState(enabledScopes?.reason || '');

    const [isEnabling, setIsEnabling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(!!enabledScopes);
    const [showCode, setShowCode] = useState(false);
    const [copied, setCopied] = useState(false);

    const hasSelection = readCategories.size > 0 || readFields.size > 0 || writeCategories.size > 0;

    const toggleReadCategory = (cat: WalletCategory) => {
        const next = new Set(readCategories);
        if (next.has(cat)) next.delete(cat);
        else next.add(cat);
        setReadCategories(next);
    };

    const toggleReadField = (field: PersonalField) => {
        const next = new Set(readFields);
        if (next.has(field)) next.delete(field);
        else next.add(field);
        setReadFields(next);
    };

    const toggleWriteCategory = (cat: WalletCategory) => {
        const next = new Set(writeCategories);
        if (next.has(cat)) next.delete(cat);
        else next.add(cat);
        setWriteCategories(next);
    };

    const handleEnable = async () => {
        if (!hasSelection) return;
        setIsEnabling(true);
        setError(null);
        try {
            const request: ConsentRequest = {};
            if (readCategories.size > 0 || readFields.size > 0) {
                request.read = {};
                if (readCategories.size > 0)
                    request.read.credentialCategories = Array.from(readCategories);
                if (readFields.size > 0) request.read.personalFields = Array.from(readFields);
            }
            if (writeCategories.size > 0) {
                request.write = { credentialCategories: Array.from(writeCategories) };
            }
            if (reason.trim()) {
                request.reason = reason.trim();
            }
            await onEnable(request);
            setIsSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to enable consent');
        } finally {
            setIsEnabling(false);
        }
    };

    const generatedCode = useMemo(() => {
        const request: any = {};
        if (readCategories.size > 0 || readFields.size > 0) {
            request.read = {};
            if (readCategories.size > 0)
                request.read.credentialCategories = Array.from(readCategories);
            if (readFields.size > 0) request.read.personalFields = Array.from(readFields);
        }
        if (writeCategories.size > 0) {
            request.write = { credentialCategories: Array.from(writeCategories) };
        }
        if (reason.trim()) {
            request.reason = reason.trim();
        }

        return `const { granted } = await learnCard.requestConsent(${JSON.stringify(
            request,
            null,
            4
        ).replace(/"([^"]+)":/g, '$1:')});`;
    }, [readCategories, readFields, writeCategories, reason]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isSuccess) {
        return (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 relative animate-fade-in-up">
                <button
                    onClick={onDismiss}
                    className="absolute top-3 right-3 p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-full transition-colors"
                >
                    <IonIcon icon={closeOutline} className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3 mb-4">
                    <IonIcon
                        icon={checkmarkCircleOutline}
                        className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"
                    />
                    <div>
                        <h4 className="text-sm font-semibold text-emerald-900 mb-1">
                            Consent is ready
                        </h4>
                        <p className="text-sm text-emerald-700">
                            Your app's requestConsent() now just works. Try it in the preview →
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {Array.from(readCategories).map(cat => (
                        <span
                            key={`read-cat-${cat}`}
                            className="px-2 py-1 bg-white text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium"
                        >
                            Read: {cat}
                        </span>
                    ))}
                    {Array.from(readFields).map(f => (
                        <span
                            key={`read-pf-${f}`}
                            className="px-2 py-1 bg-white text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium"
                        >
                            Read: {PERSONAL_FIELD_LABELS[f]}
                        </span>
                    ))}
                    {Array.from(writeCategories).map(cat => (
                        <span
                            key={`write-cat-${cat}`}
                            className="px-2 py-1 bg-white text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium"
                        >
                            Write: {cat}
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSuccess(false)}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
                    >
                        Edit selection
                    </button>
                    <button
                        onClick={() => setShowCode(!showCode)}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-1"
                    >
                        Prefer code?
                        <IonIcon
                            icon={showCode ? chevronUpOutline : chevronDownOutline}
                            className="w-3 h-3"
                        />
                    </button>
                </div>

                {showCode && (
                    <div className="mt-4 relative animate-fade-in-up">
                        <pre className="bg-white border border-emerald-200 rounded-xl p-3 text-xs font-mono text-grayscale-800 whitespace-pre overflow-x-auto">
                            {generatedCode}
                        </pre>
                        <button
                            onClick={handleCopy}
                            className="absolute top-2 right-2 py-1.5 px-3 rounded-[20px] border border-grayscale-300 bg-white text-grayscale-700 font-medium text-xs hover:bg-grayscale-10 transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                            {copied ? (
                                <>
                                    <IonIcon
                                        icon={checkmarkOutline}
                                        className="w-3.5 h-3.5 text-emerald-500"
                                    />
                                    Copied ✓
                                </>
                            ) : (
                                <>
                                    <IonIcon icon={copyOutline} className="w-3.5 h-3.5" />
                                    Copy code
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white border border-grayscale-300 rounded-2xl p-5 relative animate-fade-in-up shadow-sm">
            <button
                onClick={onDismiss}
                className="absolute top-3 right-3 p-1 text-grayscale-400 hover:text-grayscale-600 hover:bg-grayscale-100 rounded-full transition-colors"
            >
                <IonIcon icon={closeOutline} className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 mb-5">
                <IonIcon icon={flashOutline} className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-semibold text-grayscale-900 mb-1">
                        Set up consent
                    </h4>
                    <p className="text-sm text-grayscale-600">
                        Choose what {appName || 'your app'} can ask for. No code changes needed.
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
                    <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <h5 className="text-sm font-medium text-grayscale-900 mb-3">
                        What can it see?
                    </h5>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {WALLET_CATEGORIES.map(cat => {
                            const isSelected = readCategories.has(cat);
                            return (
                                <button
                                    key={`read-${cat}`}
                                    onClick={() => toggleReadCategory(cat)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors flex flex-col items-start text-left ${
                                        isSelected
                                            ? 'bg-grayscale-900 text-white'
                                            : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                    }`}
                                >
                                    <span>{cat}</span>
                                    <span
                                        className={`text-[10px] font-normal mt-0.5 ${
                                            isSelected ? 'text-grayscale-300' : 'text-grayscale-500'
                                        }`}
                                    >
                                        {CATEGORY_DESCRIPTIONS[cat]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {PERSONAL_FIELDS.map(field => {
                            const isSelected = readFields.has(field);
                            return (
                                <button
                                    key={`read-${field}`}
                                    onClick={() => toggleReadField(field)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                        isSelected
                                            ? 'bg-grayscale-900 text-white'
                                            : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                    }`}
                                >
                                    {PERSONAL_FIELD_LABELS[field]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h5 className="text-sm font-medium text-grayscale-900 mb-1">
                        What can it add?
                    </h5>
                    <p className="text-xs text-grayscale-500 mb-3">
                        Credentials your app can send into these categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {WALLET_CATEGORIES.map(cat => {
                            const isSelected = writeCategories.has(cat);
                            return (
                                <button
                                    key={`write-${cat}`}
                                    onClick={() => toggleWriteCategory(cat)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                        isSelected
                                            ? 'bg-grayscale-900 text-white'
                                            : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                    }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                        Why are you asking?
                    </label>
                    <input
                        type="text"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Personalize your experience"
                        className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleEnable}
                        disabled={!hasSelection || isEnabling}
                        className="py-3 px-6 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isEnabling ? (
                            <>
                                <IonSpinner name="crescent" className="w-4 h-4" />
                                Setting up...
                            </>
                        ) : (
                            'Enable consent'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
