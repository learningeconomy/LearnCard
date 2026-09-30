import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    fingerPrint,
    documentTextOutline,
    cloudDownloadOutline,
    checkmarkCircleOutline,
    alertCircleOutline,
    copyOutline,
    checkmarkOutline,
    mailOutline,
    closeOutline,
} from 'ionicons/icons';

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isWebAuthnSupported } from '@learncard/sss-key-manager';
import * as m from '../../paraglide/messages.js';
import { getLogger } from 'learn-card-base';
import { toFriendlyRecoveryError } from './recoveryErrors';
import { AutomaticRecoveryCard, type AutomaticRecoveryProps } from './AutomaticRecoveryCard';

const log = getLogger('recovery-setup-modal');

export type RecoverySetupType = 'passkey' | 'phrase' | 'backup' | 'email';

interface RecoverySetupModalProps extends Partial<AutomaticRecoveryProps> {
    onSetupPasskey: () => Promise<string>;
    onGeneratePhrase: () => Promise<{
        phrase: string;
        challengeWordIndices: number[];
        challengeWordOptions?: string[][];
    }>;
    onConfirmPhrase: (challengeWords: string[]) => Promise<void>;
    onSetupBackup: (password: string) => Promise<string>;
    onConfirmBackup: (fileContents: string, password: string) => Promise<void>;
    onAddRecoveryEmail: (email: string) => Promise<void>;
    onVerifyRecoveryEmail: (code: string) => Promise<{ maskedEmail: string }>;
    onSetupEmailRecovery: (email: string) => Promise<void>;
    onConfirmEmailRecovery: (code: string) => Promise<void>;
    existingMethods: { type: string; createdAt: string }[];
    maskedRecoveryEmail?: string | null;
    isActivationPending?: boolean;
    initialMethod?: RecoverySetupType;
    /** False when emailed recovery keys cannot be sent (no relay key configured). */
    emailAvailable?: boolean;
    onCompleted?: (method: RecoverySetupType) => void;
    onClose: () => void;
    registerCloseRequest?: (fn: () => void) => void;
}

const isValidChallengeOptions = (
    options: string[][] | undefined,
    challengeCount: number
): options is string[][] =>
    Array.isArray(options) &&
    options.length === challengeCount &&
    options.every(choices => Array.isArray(choices) && choices.length > 1);

export const RecoverySetupModal: React.FC<RecoverySetupModalProps> = ({
    onSetupPasskey,
    onGeneratePhrase,
    onConfirmPhrase,
    onSetupBackup,
    onConfirmBackup,
    onAddRecoveryEmail,
    onVerifyRecoveryEmail,
    onSetupEmailRecovery,
    onConfirmEmailRecovery,
    existingMethods,
    maskedRecoveryEmail,
    isActivationPending = false,
    initialMethod,
    emailAvailable = true,
    onCompleted,
    onClose,
    registerCloseRequest,
    onGetEscrowEnrollmentState,
    onDisableEscrowRecovery,
    onEnableEscrowRecovery,
    onSetEscrowPin,
    onClearEscrowPin,
}) => {
    const webAuthnSupported = isWebAuthnSupported();
    const isNative = Capacitor.isNativePlatform();

    const hasExistingMethod = (type: string) => existingMethods.some(m => m.type === type);

    // Track methods configured during this modal session (persists across tab switches)
    const [sessionConfigured, setSessionConfigured] = useState<Set<RecoverySetupType>>(new Set());

    const isConfigured = (type: RecoverySetupType): boolean =>
        hasExistingMethod(type) || sessionConfigured.has(type);

    const anyConfigured =
        existingMethods.some(method => method.type !== 'escrow') || sessionConfigured.size > 0;

    // Default to the first unconfigured method in priority order:
    // email > phrase > backup > passkey
    const [showLeaveGuard, setShowLeaveGuard] = useState(false);
    const [pendingAction, setPendingAction] = useState<'close' | RecoverySetupType | null>(null);
    const [activeTab, setActiveTab] = useState<RecoverySetupType>(() => {
        if (
            initialMethod &&
            !isConfigured(initialMethod) &&
            (initialMethod !== 'email' || emailAvailable)
        )
            return initialMethod;
        if (emailAvailable && !isConfigured('email')) return 'email';
        if (!isConfigured('phrase')) return 'phrase';
        if (!isConfigured('backup')) return 'backup';
        if (!isNative && webAuthnSupported && !isConfigured('passkey')) return 'passkey';

        return 'email';
    });

    // Whether the user clicked "Change" on an already-configured method
    const [showUpdateForm, setShowUpdateForm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);
    const [phraseCopied, setPhraseCopied] = useState(false);
    const [phraseChallengeStarted, setPhraseChallengeStarted] = useState(false);
    const [phraseChallengeWordIndices, setPhraseChallengeWordIndices] = useState<number[]>([]);
    const [phraseChallengeWords, setPhraseChallengeWords] = useState<string[]>([]);
    const [phraseChallengeOptions, setPhraseChallengeOptions] = useState<string[][]>([]);
    const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
    const [wrongTaps, setWrongTaps] = useState<Set<string>>(new Set());
    const [wrongTapsCount, setWrongTapsCount] = useState(0);
    const [correctTap, setCorrectTap] = useState<string | null>(null);

    const [backupPassword, setBackupPassword] = useState('');
    const [confirmBackupPassword, setConfirmBackupPassword] = useState('');
    const [backupFileJson, setBackupFileJson] = useState<string | null>(null);
    const [backupDownloaded, setBackupDownloaded] = useState(false);
    const [backupConfirmed, setBackupConfirmed] = useState(false);
    const [backupVerificationPassword, setBackupVerificationPassword] = useState('');

    // Email recovery state
    const [emailInput, setEmailInput] = useState('');
    const [emailCodeSent, setEmailCodeSent] = useState(false);
    const [emailCode, setEmailCode] = useState('');
    const [emailVerified, setEmailVerified] = useState(!!maskedRecoveryEmail);
    const [emailMasked, setEmailMasked] = useState(maskedRecoveryEmail ?? '');
    const [emailShareSent, setEmailShareSent] = useState(false);
    const [emailCheckPending, setEmailCheckPending] = useState(false);
    const [emailRecoveryCode, setEmailRecoveryCode] = useState('');

    // A method is unfinished from the moment it is saved until its check passes,
    // including when it replaces one that already works.
    const unfinished: RecoverySetupType | null =
        recoveryPhrase !== null
            ? 'phrase'
            : backupDownloaded && !backupConfirmed
              ? 'backup'
              : emailShareSent && emailCheckPending
                ? 'email'
                : null;

    const requestClose = React.useCallback(() => {
        if (unfinished) {
            setPendingAction('close');
            setShowLeaveGuard(true);
        } else {
            onClose();
        }
    }, [unfinished, onClose]);

    React.useEffect(() => {
        if (registerCloseRequest) {
            registerCloseRequest(requestClose);
        }
    }, [registerCloseRequest, requestClose]);

    const handleDiscard = () => {
        if (unfinished === 'phrase') {
            setRecoveryPhrase(null);
            setPhraseChallengeStarted(false);
            setPhraseChallengeWords([]);
            setCurrentChallengeIndex(0);
            setWrongTaps(new Set());
            setWrongTapsCount(0);
            setCorrectTap(null);
        } else if (unfinished === 'backup') {
            setBackupDownloaded(false);
            setBackupVerificationPassword('');
        } else if (unfinished === 'email') {
            setEmailShareSent(false);
            setEmailRecoveryCode('');
            setEmailCheckPending(false);
        }
        setShowLeaveGuard(false);
        if (pendingAction === 'close') {
            onClose();
        } else if (pendingAction) {
            setActiveTab(pendingAction);
            setError(null);
            setSuccess(null);
            setShowUpdateForm(false);
        }
        setPendingAction(null);
    };

    const handleTabSwitch = (tab: RecoverySetupType) => {
        if (unfinished && tab !== activeTab) {
            setPendingAction(tab);
            setShowLeaveGuard(true);
            return;
        }
        setActiveTab(tab);
        setError(null);
        setSuccess(null);
        setShowUpdateForm(false);
    };

    const markConfigured = (type: RecoverySetupType) => {
        setSessionConfigured(prev => new Set(prev).add(type));
    };

    // Whether the active tab's form is for an update (vs first-time setup)
    const isUpdate = isConfigured(activeTab) && showUpdateForm;

    const handlePasskeySetup = async () => {
        setLoading(true);
        setError(null);

        try {
            await onSetupPasskey();
            markConfigured('passkey');
            setSuccess(m['recovery.success.passkeySetup']());
            setShowUpdateForm(false);
            onCompleted?.('passkey');
        } catch (e) {
            log.error('handlePasskeySetup error', e);
            setError(e instanceof Error ? e.message : m['recovery.somethingWrong']());
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePhrase = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await onGeneratePhrase();
            setRecoveryPhrase(result.phrase);
            setPhraseChallengeWordIndices(result.challengeWordIndices);
            const options = isValidChallengeOptions(
                result.challengeWordOptions,
                result.challengeWordIndices.length
            )
                ? result.challengeWordOptions
                : [];
            setPhraseChallengeOptions(options);
            setPhraseChallengeWords(
                options.length > 0 ? [] : result.challengeWordIndices.map(() => '')
            );
            setCurrentChallengeIndex(0);
            setWrongTaps(new Set());
            setWrongTapsCount(0);
            setCorrectTap(null);
            setPhraseChallengeStarted(false);
        } catch (e) {
            log.error('handleGeneratePhrase error', e);
            setError(e instanceof Error ? e.message : m['recovery.somethingWrong']());
        } finally {
            setLoading(false);
        }
    };

    const handleCopyPhrase = async () => {
        if (recoveryPhrase) {
            await navigator.clipboard.writeText(recoveryPhrase);
            setPhraseCopied(true);
            setTimeout(() => setPhraseCopied(false), 2000);
        }
    };

    const handleChipTap = async (word: string) => {
        if (loading || correctTap) return;

        const expectedWord =
            recoveryPhrase?.split(' ')[phraseChallengeWordIndices[currentChallengeIndex]];

        if (word === expectedWord) {
            setCorrectTap(word);

            setTimeout(async () => {
                const newWords = [...phraseChallengeWords.slice(0, currentChallengeIndex), word];
                setPhraseChallengeWords(newWords);

                if (currentChallengeIndex < phraseChallengeWordIndices.length - 1) {
                    setCurrentChallengeIndex(prev => prev + 1);
                    setWrongTaps(new Set());
                    setWrongTapsCount(0);
                    setCorrectTap(null);
                } else {
                    setLoading(true);
                    setError(null);

                    try {
                        await onConfirmPhrase(newWords);
                        markConfigured('phrase');
                        setRecoveryPhrase(null);
                        setPhraseChallengeStarted(false);
                        setSuccess(m['recovery.success.phraseSaved']());
                        setShowUpdateForm(false);
                        onCompleted?.('phrase');
                    } catch (e) {
                        setError(toFriendlyRecoveryError(e));
                    } finally {
                        setLoading(false);
                        setCorrectTap(null);
                    }
                }
            }, 250);
        } else {
            setWrongTaps(prev => new Set(prev).add(word));
            setWrongTapsCount(prev => prev + 1);
        }
    };

    const handleConfirmPhrase = async () => {
        setLoading(true);
        setError(null);

        try {
            await onConfirmPhrase(phraseChallengeWords);
            markConfigured('phrase');
            setRecoveryPhrase(null);
            setPhraseChallengeStarted(false);
            setSuccess(m['recovery.success.phraseSaved']());
            setShowUpdateForm(false);
            onCompleted?.('phrase');
        } catch (e) {
            setError(toFriendlyRecoveryError(e));
        } finally {
            setLoading(false);
        }
    };

    const handleBackupSetup = async () => {
        if (backupPassword.length < 8) {
            setError(m['recovery.somethingWrong']());
            return;
        }

        if (backupPassword !== confirmBackupPassword) {
            setError(m['recovery.passwordsDontMatch']());
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const fileJson = await onSetupBackup(backupPassword);
            setBackupFileJson(fileJson);
            setBackupPassword('');
            setConfirmBackupPassword('');
            setBackupVerificationPassword('');
        } catch (e) {
            log.error('handleBackupSetup error', e);
            setError(e instanceof Error ? e.message : m['recovery.somethingWrong']());
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBackup = async () => {
        if (!backupFileJson) return;

        const fileName = `learncard-backup-${new Date().toISOString().slice(0, 10)}.json`;

        if (Capacitor.isNativePlatform()) {
            try {
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: backupFileJson,
                    directory: Directory.Cache,
                    encoding: Encoding.UTF8,
                });

                await Share.share({
                    title: m['recovery.learnCardBackup']({ brand: 'LearnCard' }),
                    url: result.uri,
                    dialogTitle: m['recovery.saveBackupFile'](),
                });

                setBackupDownloaded(true);
                setBackupConfirmed(false);
            } catch (e) {
                log.error('Native file download failed', e);
                setError(m['recovery.couldNotSave']());
            }
        } else {
            const blob = new Blob([backupFileJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
            setBackupDownloaded(true);
            setBackupConfirmed(false);
        }
    };

    const handleConfirmBackup = async () => {
        if (!backupFileJson || !backupVerificationPassword) return;

        setLoading(true);
        setError(null);

        try {
            await onConfirmBackup(backupFileJson, backupVerificationPassword);
            setBackupConfirmed(true);
            markConfigured('backup');
            setSuccess(m['recovery.success.backupSaved']());
            setBackupVerificationPassword('');
            setShowUpdateForm(false);
            onCompleted?.('backup');
        } catch (e) {
            setError(toFriendlyRecoveryError(e));
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmailCode = async () => {
        if (!emailInput.includes('@')) {
            setError(m['recovery.validEmail']());
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onAddRecoveryEmail(emailInput);
            setEmailCodeSent(true);
        } catch (e) {
            log.error('handleSendEmailCode error', e);
            setError(e instanceof Error ? e.message : m['recovery.somethingWrong']());
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmailCode = async () => {
        if (emailCode.length !== 6) {
            setError(m['recovery.somethingWrong']());
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { maskedEmail } = await onVerifyRecoveryEmail(emailCode);
            setEmailVerified(true);
            setEmailMasked(maskedEmail);
        } catch (e) {
            log.error('handleVerifyEmailCode error', e);
            setError(e instanceof Error ? e.message : m['recovery.incorrectCode']());
        } finally {
            setLoading(false);
        }
    };

    const handleSetupEmailRecovery = async () => {
        setLoading(true);
        setError(null);

        try {
            await onSetupEmailRecovery(emailInput);
            setEmailShareSent(true);
            setEmailCheckPending(true);
        } catch (e) {
            log.error('handleSetupEmailRecovery error', e);
            setError(e instanceof Error ? e.message : m['recovery.somethingWrong']());
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmEmailRecovery = async () => {
        if (emailRecoveryCode.length !== 6) return;

        setLoading(true);
        setError(null);

        try {
            await onConfirmEmailRecovery(emailRecoveryCode);
            markConfigured('email');
            setEmailCheckPending(false);
            setSuccess(m['recovery.success.recoveryKeySent']());
            setShowUpdateForm(false);
            onCompleted?.('email');
        } catch (e) {
            setError(toFriendlyRecoveryError(e));
        } finally {
            setLoading(false);
        }
    };

    const allTabs = [
        {
            id: 'email' as const,
            label: m['recovery.tab.email'](),
            icon: mailOutline,
            iconClass: 'text-sm',
        },
        {
            id: 'phrase' as const,
            label: m['recovery.tab.phrase'](),
            icon: documentTextOutline,
            iconClass: 'text-sm',
        },
        {
            id: 'backup' as const,
            label: m['recovery.tab.backup'](),
            icon: cloudDownloadOutline,
            iconClass: 'text-sm',
        },
        {
            id: 'passkey' as const,
            label: m['recovery.method.passkey'](),
            icon: fingerPrint,
            iconClass: 'text-sm',
        },
    ];

    // Hide passkey tab entirely on native platforms (WebAuthn unavailable in WKWebView / Android WebView)
    const tabs = allTabs.filter(
        t => !(isNative && t.id === 'passkey') && !(!emailAvailable && t.id === 'email')
    );

    const configuredCount = tabs.filter(t => isConfigured(t.id)).length;

    // ── Shared helpers ──────────────────────────────────────────────

    const StepIndicator = ({
        step,
        label1,
        label2,
    }: {
        step: 1 | 2;
        label1: string;
        label2: string;
    }) => (
        <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1">
                <div
                    className={`w-1.5 h-1.5 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-grayscale-300'}`}
                />
                <div
                    className={`w-1.5 h-1.5 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-grayscale-300'}`}
                />
            </div>
            <span className="text-xs text-grayscale-500 font-medium">
                {m['recovery.stepOf']({ current: String(step), total: '2' })} ·{' '}
                {step === 1 ? label1 : label2}
            </span>
        </div>
    );

    const updateWarning = (text: string) => (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5">
            <IonIcon
                icon={alertCircleOutline}
                className="text-amber-500 text-base mt-0.5 shrink-0"
            />

            <span className="text-xs text-amber-700 leading-relaxed">{text}</span>
        </div>
    );

    const cancelUpdateButton = (onCancel?: () => void) => (
        <button
            onClick={() => {
                setShowUpdateForm(false);
                setError(null);
                onCancel?.();
            }}
            className="w-full py-2.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
        >
            {m['common.cancel']()}
        </button>
    );

    const primaryButton = (
        label: string,
        onClick: () => void,
        disabled: boolean,
        loadingText: string
    ) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {loadingText}
                </span>
            ) : (
                label
            )}
        </button>
    );

    // ── Render ─────────────────────────────────────────────────────────

    return (
        <div className="p-6 max-w-md mx-auto bg-white min-h-full relative">
            {showLeaveGuard && (
                <div
                    className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in-up motion-reduce:animate-none"
                    role="alertdialog"
                    aria-labelledby="leave-guard-title"
                    aria-describedby="leave-guard-desc"
                >
                    <div className="bg-white rounded-[20px] shadow-2xl border border-grayscale-200 p-6 w-full max-w-sm text-center">
                        <h3
                            id="leave-guard-title"
                            className="text-lg font-semibold text-grayscale-900 mb-2"
                        >
                            {unfinished === 'phrase'
                                ? m['recovery.guard.phraseTitle']()
                                : unfinished === 'backup'
                                  ? m['recovery.guard.backupTitle']()
                                  : m['recovery.guard.emailTitle']()}
                        </h3>
                        <p id="leave-guard-desc" className="text-sm text-grayscale-600 mb-6">
                            {m['recovery.guard.body']()}
                        </p>
                        <div className="space-y-3">
                            <button
                                autoFocus
                                onClick={() => setShowLeaveGuard(false)}
                                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                                {m['recovery.guard.finish']()}
                            </button>
                            <div>
                                <button
                                    onClick={handleDiscard}
                                    className="w-full py-2.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors font-medium"
                                >
                                    {unfinished === 'phrase'
                                        ? m['recovery.guard.discardPhrase']()
                                        : unfinished === 'backup'
                                          ? m['recovery.guard.discardBackup']()
                                          : m['recovery.guard.discardEmail']()}
                                </button>
                                {(unfinished === 'phrase' || unfinished === 'backup') && (
                                    <p className="text-xs text-grayscale-500 mt-1">
                                        {m['recovery.guard.discardNote']()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dynamic Header */}
            <div className="relative text-center mb-5">
                <button
                    type="button"
                    onClick={requestClose}
                    aria-label={m['common.close']()}
                    className="absolute top-0 end-0 p-2 rounded-full text-grayscale-500 hover:text-grayscale-700 hover:bg-grayscale-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    <IonIcon icon={closeOutline} className="text-lg" />
                </button>

                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    {anyConfigured
                        ? m['recovery.accountRecovery']()
                        : m['recovery.protectAccount']()}
                </h2>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {anyConfigured
                        ? m['recovery.method.activeCount']({
                              count: String(configuredCount),
                              state:
                                  configuredCount === 1
                                      ? m['recovery.method.singular']()
                                      : m['recovery.method.plural'](),
                          })
                        : m['recovery.setupRecovery']()}
                </p>
            </div>

            <div className="mb-6 rounded-2xl border border-grayscale-200 bg-white divide-y divide-grayscale-100">
                {onGetEscrowEnrollmentState &&
                    onDisableEscrowRecovery &&
                    onEnableEscrowRecovery && (
                        <AutomaticRecoveryCard
                            onGetEscrowEnrollmentState={onGetEscrowEnrollmentState}
                            onDisableEscrowRecovery={onDisableEscrowRecovery}
                            onEnableEscrowRecovery={onEnableEscrowRecovery}
                            onSetEscrowPin={onSetEscrowPin}
                            onClearEscrowPin={onClearEscrowPin}
                        />
                    )}
                {tabs
                    .filter(t => isConfigured(t.id))
                    .map(tab => (
                        <div key={tab.id} className="py-3 px-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-grayscale-100 text-grayscale-500">
                                <IonIcon icon={tab.icon} className="text-lg" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-grayscale-900">
                                    {tab.label}
                                </div>
                                <div className="text-xs text-grayscale-500 truncate">
                                    {tab.id === 'email' && emailMasked
                                        ? emailMasked
                                        : m['recovery.added']()}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    handleTabSwitch(tab.id);
                                    setShowUpdateForm(true);
                                }}
                                className="shrink-0 text-xs font-medium text-grayscale-500 hover:text-grayscale-900 transition-colors"
                            >
                                {m['recovery.action.change']()}
                            </button>
                        </div>
                    ))}
            </div>

            {/* Tabs */}
            {configuredCount === tabs.length ? (
                <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon
                        icon={checkmarkCircleOutline}
                        className="text-emerald-500 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-emerald-700 leading-relaxed">
                        {m['recovery.fullyProtected']()}
                    </span>
                </div>
            ) : (
                <>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-grayscale-500 mb-2">
                        {configuredCount === 0
                            ? m['recovery.addWayBackIn']()
                            : m['recovery.addAnotherMethod']()}
                    </h3>
                    <div className="flex gap-1.5 mb-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabSwitch(tab.id)}
                                className={`flex-1 min-w-0 py-2 px-2 rounded-full flex items-center justify-center gap-1 text-xs font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-grayscale-900 text-white'
                                        : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                }`}
                            >
                                <IonIcon icon={tab.icon} className={tab.iconClass} />
                                {tab.label}
                                {unfinished === tab.id && (
                                    <>
                                        <span
                                            aria-hidden="true"
                                            className="w-1.5 h-1.5 rounded-full bg-amber-500 ms-1"
                                        />
                                        <span className="sr-only">
                                            {m['recovery.notFinished']()}
                                        </span>
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Error */}
            {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-400 text-lg mt-0.5 shrink-0"
                    />

                    <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                </div>
            )}

            {/* Success */}
            {success && (
                <div className="mb-5 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon
                        icon={checkmarkCircleOutline}
                        className="text-emerald-500 text-lg mt-0.5 shrink-0"
                    />

                    <span className="text-sm text-emerald-700 leading-relaxed">{success}</span>
                </div>
            )}

            {(configuredCount < tabs.length || showUpdateForm) && (
                <>
                    {/* ── Passkey Tab ───────────────────────────────────── */}
                    {activeTab === 'passkey' && (
                        <div className="space-y-4">
                            {!webAuthnSupported ? (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                    <p className="text-sm text-amber-800 leading-relaxed">
                                        {m['recovery.passkeyNotSupported']()}
                                    </p>
                                </div>
                            ) : isConfigured('passkey') && !showUpdateForm ? null : (
                                <>
                                    {isUpdate && updateWarning(m['recovery.replacePasskey']())}

                                    <div>
                                        <p className="text-sm text-grayscale-600 leading-relaxed">
                                            {m['recovery.passkeyUseFaceId']()}
                                        </p>
                                        <p className="text-xs text-grayscale-500 mt-1">
                                            {m['recovery.passkeyDesktopOnly']()}
                                        </p>
                                        <p className="text-xs text-grayscale-500 mt-1">
                                            {m['recovery.passkeyBiometric']()} ·{' '}
                                            {m['recovery.passkeyNoPassword']()}
                                        </p>
                                    </div>

                                    {primaryButton(
                                        isUpdate
                                            ? m['recovery.action.replacePasskey']()
                                            : m['recovery.action.setUpPasskey'](),
                                        handlePasskeySetup,
                                        loading,
                                        isUpdate
                                            ? m['recovery.action.settingUp']()
                                            : m['recovery.action.settingUp']()
                                    )}

                                    {isUpdate && cancelUpdateButton()}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Phrase Tab ────────────────────────────────────── */}
                    {activeTab === 'phrase' && (
                        <div className="space-y-4">
                            {isConfigured('phrase') &&
                            !showUpdateForm &&
                            !recoveryPhrase ? null : phraseChallengeStarted ? (
                                <>
                                    <StepIndicator
                                        step={2}
                                        label1={m['recovery.step.save']()}
                                        label2={m['recovery.step.check']()}
                                    />
                                    {phraseChallengeOptions.length > 0 ? (
                                        <>
                                            <div className="mb-4">
                                                <h3
                                                    id="phrase-challenge-heading"
                                                    className="text-sm font-semibold text-grayscale-900 mb-1"
                                                >
                                                    {m['recovery.whichWordIs']({
                                                        number: String(
                                                            phraseChallengeWordIndices[
                                                                currentChallengeIndex
                                                            ] + 1
                                                        ),
                                                    })}
                                                </h3>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-grayscale-600 leading-relaxed">
                                                        {m['recovery.tapTheWord']()}
                                                    </p>
                                                    <span className="text-xs font-medium text-grayscale-500">
                                                        {m['recovery.challengeProgress']({
                                                            current: String(
                                                                currentChallengeIndex + 1
                                                            ),
                                                            total: String(
                                                                phraseChallengeWordIndices.length
                                                            ),
                                                        })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div
                                                role="group"
                                                aria-labelledby="phrase-challenge-heading"
                                                className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
                                            >
                                                {phraseChallengeOptions[currentChallengeIndex].map(
                                                    word => {
                                                        const isWrong = wrongTaps.has(word);
                                                        const isCorrect = correctTap === word;
                                                        return (
                                                            <button
                                                                key={word}
                                                                onClick={() => handleChipTap(word)}
                                                                disabled={
                                                                    isWrong ||
                                                                    loading ||
                                                                    correctTap !== null
                                                                }
                                                                className={`
                                                                min-h-[44px] px-3 py-2 rounded-[20px] text-sm font-medium transition-all
                                                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                                                                ${
                                                                    isCorrect
                                                                        ? 'bg-emerald-500 text-white border border-transparent'
                                                                        : isWrong
                                                                          ? 'bg-red-50 text-red-700 border border-red-200'
                                                                          : 'bg-grayscale-100 text-grayscale-900 hover:bg-grayscale-200 border border-transparent'
                                                                }
                                                            `}
                                                            >
                                                                {word}
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>

                                            {wrongTapsCount > 0 && (
                                                <div
                                                    aria-live="polite"
                                                    className="mb-4 text-sm text-red-600 text-center"
                                                >
                                                    {m['recovery.wrongWord']({
                                                        number: String(
                                                            phraseChallengeWordIndices[
                                                                currentChallengeIndex
                                                            ] + 1
                                                        ),
                                                    })}
                                                </div>
                                            )}

                                            {wrongTapsCount >= 2 && (
                                                <button
                                                    onClick={() => {
                                                        setPhraseChallengeStarted(false);
                                                        setPhraseChallengeWords([]);
                                                        setCurrentChallengeIndex(0);
                                                        setWrongTaps(new Set());
                                                        setWrongTapsCount(0);
                                                        setCorrectTap(null);
                                                    }}
                                                    className="w-full py-2.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                                                >
                                                    {m['recovery.showPhraseAgain']()}
                                                </button>
                                            )}

                                            {loading && (
                                                <div className="flex items-center justify-center gap-2 text-sm text-grayscale-600 mt-4">
                                                    <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-900 rounded-full animate-spin" />
                                                    {m['common.verifying']()}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <h3 className="text-sm font-semibold text-grayscale-900 mb-1">
                                                    {m['recovery.verifyPhraseTitle']()}
                                                </h3>
                                                <p className="text-sm text-grayscale-600 leading-relaxed">
                                                    {m['recovery.verifyPhraseDescription']()}
                                                </p>
                                            </div>

                                            {phraseChallengeWordIndices.map(
                                                (wordIndex, challengeIndex) => (
                                                    <div key={wordIndex}>
                                                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                                            {m['recovery.wordNumber']({
                                                                number: String(wordIndex + 1),
                                                            })}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            autoCapitalize="none"
                                                            autoCorrect="off"
                                                            value={
                                                                phraseChallengeWords[
                                                                    challengeIndex
                                                                ] ?? ''
                                                            }
                                                            onChange={event =>
                                                                setPhraseChallengeWords(words =>
                                                                    words.map((word, index) =>
                                                                        index === challengeIndex
                                                                            ? event.target.value
                                                                                  .trimStart()
                                                                                  .toLowerCase()
                                                                            : word
                                                                    )
                                                                )
                                                            }
                                                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                                        />
                                                    </div>
                                                )
                                            )}

                                            {primaryButton(
                                                m['recovery.confirmPhrase'](),
                                                handleConfirmPhrase,
                                                loading ||
                                                    phraseChallengeWords.some(word => !word.trim()),
                                                m['common.verifying']()
                                            )}
                                        </>
                                    )}
                                </>
                            ) : !recoveryPhrase ? (
                                <>
                                    <StepIndicator
                                        step={1}
                                        label1={m['recovery.step.save']()}
                                        label2={m['recovery.step.check']()}
                                    />
                                    {isUpdate && updateWarning(m['recovery.generateNewPhrase']())}

                                    <div>
                                        <p className="text-sm text-grayscale-600 leading-relaxed">
                                            {m['recovery.phraseDescription']()}
                                        </p>
                                        <p className="text-xs text-grayscale-500 mt-1">
                                            {m['recovery.phraseWriteOnPaper']()} ·{' '}
                                            {m['recovery.phraseNeverShare']()}
                                        </p>
                                    </div>

                                    {primaryButton(
                                        isUpdate
                                            ? m['recovery.action.generateNewPhrase']()
                                            : m['recovery.action.generatePhrase'](),
                                        handleGeneratePhrase,
                                        loading,
                                        m['recovery.generating']()
                                    )}

                                    {isUpdate && cancelUpdateButton()}
                                </>
                            ) : (
                                <>
                                    <StepIndicator
                                        step={1}
                                        label1={m['recovery.step.save']()}
                                        label2={m['recovery.step.check']()}
                                    />
                                    <div className="p-4 bg-grayscale-900 rounded-2xl">
                                        <p className="text-xs text-grayscale-400 mb-2 font-medium">
                                            {m['recovery.yourRecoveryPhrase']()}
                                        </p>

                                        <p className="font-mono text-sm text-white leading-relaxed break-words">
                                            {recoveryPhrase}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleCopyPhrase}
                                        className="w-full py-2.5 px-4 bg-grayscale-100 hover:bg-grayscale-200 rounded-[20px] flex items-center justify-center gap-2 text-sm text-grayscale-700 font-medium transition-colors"
                                    >
                                        <IonIcon
                                            icon={phraseCopied ? checkmarkOutline : copyOutline}
                                            className="text-base"
                                        />
                                        {phraseCopied
                                            ? m['recovery.copied']()
                                            : m['recovery.copyToClipboard']()}
                                    </button>

                                    <button
                                        onClick={() => setPhraseChallengeStarted(true)}
                                        className="w-full py-3 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
                                    >
                                        {m['recovery.action.nextCheckIt']()}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Backup Tab ──────────────────────────────────── */}
                    {activeTab === 'backup' && (
                        <div className="space-y-4">
                            {isConfigured('backup') &&
                            !showUpdateForm &&
                            !backupFileJson ? null : !backupFileJson ? (
                                <>
                                    <StepIndicator
                                        step={1}
                                        label1={m['recovery.step.save']()}
                                        label2={m['recovery.step.check']()}
                                    />
                                    {isUpdate && updateWarning(m['recovery.generateNewBackup']())}

                                    <p className="text-sm text-grayscale-600 leading-relaxed">
                                        {m['recovery.backupDescription']()}
                                    </p>

                                    <div>
                                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                            {m['recovery.backupPassword']()}
                                        </label>

                                        <input
                                            type="password"
                                            value={backupPassword}
                                            onChange={e => setBackupPassword(e.target.value)}
                                            placeholder={m['recovery.placeholder.minLength']()}
                                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                            {m['recovery.confirmPassword']()}
                                        </label>

                                        <input
                                            type="password"
                                            value={confirmBackupPassword}
                                            onChange={e => setConfirmBackupPassword(e.target.value)}
                                            placeholder={m['recovery.placeholder.typeAgain']()}
                                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                        />
                                    </div>

                                    {primaryButton(
                                        isUpdate
                                            ? m['recovery.action.generateNewBackup']()
                                            : m['recovery.action.generateBackup'](),
                                        handleBackupSetup,
                                        loading || !backupPassword || !confirmBackupPassword,
                                        m['recovery.generating']()
                                    )}

                                    {isUpdate &&
                                        cancelUpdateButton(() => {
                                            setBackupPassword('');
                                            setConfirmBackupPassword('');
                                        })}
                                </>
                            ) : (
                                <>
                                    <StepIndicator
                                        step={backupDownloaded ? 2 : 1}
                                        label1={m['recovery.step.save']()}
                                        label2={m['recovery.step.check']()}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-grayscale-900 mb-1">
                                            {m['recovery.backupReady']()}
                                        </p>
                                        <p className="text-xs text-grayscale-500 leading-relaxed">
                                            {m['recovery.backupReadyDesc']()}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleDownloadBackup}
                                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        <IonIcon
                                            icon={cloudDownloadOutline}
                                            className="text-base"
                                        />
                                        {backupDownloaded
                                            ? m['recovery.action.downloadAgain']()
                                            : m['recovery.action.downloadBackup']()}
                                    </button>

                                    {backupDownloaded && !backupConfirmed && (
                                        <div className="space-y-4">
                                            <p className="text-xs text-grayscale-600 mb-3">
                                                {m['recovery.hint.oneMoreStep']()}
                                            </p>
                                            <div>
                                                <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                                    {m['recovery.reenterPassword']()}
                                                </label>
                                                <input
                                                    type="password"
                                                    value={backupVerificationPassword}
                                                    onChange={event =>
                                                        setBackupVerificationPassword(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder={m[
                                                        'recovery.placeholder.typeAgain'
                                                    ]()}
                                                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                                />
                                                <p className="mt-1.5 text-xs text-grayscale-500">
                                                    {m['recovery.verifyBackupDescription']()}
                                                </p>
                                            </div>

                                            {primaryButton(
                                                m['recovery.verifyBackup'](),
                                                handleConfirmBackup,
                                                loading || !backupVerificationPassword,
                                                m['common.verifying']()
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Email Tab ─────────────────────────────────── */}
                    {activeTab === 'email' && (
                        <div className="space-y-4">
                            {isConfigured('email') && !showUpdateForm ? null : !emailVerified ? (
                                // Step 1 & 2: Verify email
                                <>
                                    <StepIndicator
                                        step={1}
                                        label1={m['recovery.step.send']()}
                                        label2={m['recovery.step.check']()}
                                    />
                                    {isUpdate && updateWarning(m['recovery.replaceEmail']())}

                                    {!anyConfigured && (
                                        <span className="inline-block text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                                            {m['recovery.recommended']()}
                                        </span>
                                    )}

                                    <p className="text-sm text-grayscale-600 leading-relaxed">
                                        {m['recovery.emailDescription']()}
                                    </p>

                                    {!emailCodeSent ? (
                                        // Step 1: Enter email
                                        <>
                                            <div>
                                                <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                                    {m['recovery.recoveryEmail']()}
                                                </label>

                                                <input
                                                    type="email"
                                                    value={emailInput}
                                                    onChange={e => setEmailInput(e.target.value)}
                                                    placeholder="personal@gmail.com"
                                                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                                />
                                            </div>

                                            {primaryButton(
                                                m['recovery.sendVerificationCode'](),
                                                handleSendEmailCode,
                                                loading || !emailInput.includes('@'),
                                                m['recovery.sending']()
                                            )}

                                            {isUpdate &&
                                                cancelUpdateButton(() => {
                                                    setEmailInput('');
                                                    setEmailCodeSent(false);
                                                })}
                                        </>
                                    ) : (
                                        // Step 2: Enter code
                                        <>
                                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                                <p className="text-sm text-emerald-700 leading-relaxed">
                                                    {m['recovery.emailCodeSent']()}{' '}
                                                    <strong>{emailInput}</strong>.{' '}
                                                    {m['recovery.checkInbox']()}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                                    {m['recovery.verificationCode']()}
                                                </label>

                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    value={emailCode}
                                                    onChange={e =>
                                                        setEmailCode(
                                                            e.target.value
                                                                .replace(/\D/g, '')
                                                                .slice(0, 6)
                                                        )
                                                    }
                                                    placeholder="123456"
                                                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-center tracking-[0.3em] font-mono"
                                                />
                                            </div>

                                            {primaryButton(
                                                m['recovery.verifyCode'](),
                                                handleVerifyEmailCode,
                                                loading || emailCode.length !== 6,
                                                m['common.verifying']()
                                            )}

                                            <button
                                                onClick={() => {
                                                    setEmailCodeSent(false);
                                                    setEmailCode('');
                                                }}
                                                className="w-full py-2.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                                            >
                                                {m['recovery.useDifferentEmail']()}
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : !emailShareSent ? (
                                // Step 3: Email verified, send recovery share
                                <>
                                    <StepIndicator
                                        step={1}
                                        label1={m['recovery.step.send']()}
                                        label2={m['recovery.step.check']()}
                                    />
                                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
                                        <IonIcon
                                            icon={checkmarkCircleOutline}
                                            className="text-emerald-500 text-lg mt-0.5 shrink-0"
                                        />

                                        <div>
                                            <p className="text-sm font-medium text-emerald-800">
                                                {m['recovery.emailVerified']()}
                                            </p>

                                            <p className="text-xs text-emerald-700 mt-0.5">
                                                {emailMasked}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-grayscale-600 leading-relaxed">
                                        {m['recovery.emailKeyDescription']()}
                                    </p>

                                    {primaryButton(
                                        m['recovery.sendRecoveryKey'](),
                                        handleSetupEmailRecovery,
                                        loading,
                                        m['recovery.sending']()
                                    )}

                                    {isUpdate && cancelUpdateButton()}
                                </>
                            ) : (
                                // Step 4: Confirm receipt of the recovery key
                                <>
                                    <StepIndicator
                                        step={2}
                                        label1={m['recovery.step.send']()}
                                        label2={m['recovery.step.check']()}
                                    />
                                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                        <p className="text-sm text-emerald-700 leading-relaxed">
                                            {m['recovery.recoveryConfirmationCodeSent']({
                                                email: emailMasked,
                                            })}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                            {m['recovery.verificationCode']()}
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={emailRecoveryCode}
                                            onChange={event =>
                                                setEmailRecoveryCode(
                                                    event.target.value
                                                        .replace(/\D/g, '')
                                                        .slice(0, 6)
                                                )
                                            }
                                            placeholder="123456"
                                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-center tracking-[0.3em] font-mono"
                                        />
                                    </div>

                                    {primaryButton(
                                        m['recovery.confirmRecoveryKey'](),
                                        handleConfirmEmailRecovery,
                                        loading || emailRecoveryCode.length !== 6,
                                        m['common.verifying']()
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Bottom action */}
            {!isActivationPending && (
                <div className="mt-6 pt-4 border-t border-grayscale-200">
                    {anyConfigured && configuredCount < tabs.length && (
                        <p className="mb-3 text-center text-xs text-grayscale-500 leading-relaxed">
                            {configuredCount === 1
                                ? m['recovery.recommendTwo']()
                                : m['recovery.addingMethod']()}
                        </p>
                    )}
                    <button
                        onClick={requestClose}
                        className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                    >
                        {anyConfigured ? m['common.done']() : m['common.skipForNow']()}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecoverySetupModal;
