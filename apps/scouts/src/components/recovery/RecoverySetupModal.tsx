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
} from 'ionicons/icons';

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isWebAuthnSupported } from '@learncard/sss-key-manager';
import * as m from '../../paraglide/messages.js';
import { TransP } from '../../i18n/TransP';
import { getLogger } from 'learn-card-base';
const log = getLogger('recovery-setup-modal');

/** Map raw confirmation errors to friendly, localized copy. Never surface Error.message directly. */
const toFriendlyConfirmError = (err: unknown): string => {
    if (err instanceof Error) {
        const msg = err.message.toLowerCase();

        if (msg.includes('decrypt') || msg.includes('password')) {
            return m['recovery.errors.decryptFailed']();
        }

        if (msg.includes('phrase') || msg.includes('word') || msg.includes('mnemonic')) {
            return m['recovery.errors.phraseInvalid']();
        }

        if (msg.includes('code') || msg.includes('expire')) {
            return m['recovery.setup.errors.incorrectCode']();
        }
    }

    return m['error.generic']();
};

export type RecoverySetupType = 'passkey' | 'phrase' | 'backup' | 'email';

interface RecoverySetupModalProps {
    onSetupPasskey: () => Promise<string>;
    onGeneratePhrase: () => Promise<{ phrase: string; challengeWordIndices: number[] }>;
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
    onCompleted?: (method: RecoverySetupType) => void;
    onClose: () => void;
}

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
    onCompleted,
    onClose,
}) => {
    const webAuthnSupported = isWebAuthnSupported();
    const isNative = Capacitor.isNativePlatform();

    const hasExistingMethod = (type: string) => existingMethods.some(m => m.type === type);

    // Track methods configured during this modal session (persists across tab switches)
    const [sessionConfigured, setSessionConfigured] = useState<Set<RecoverySetupType>>(new Set());

    const isConfigured = (type: RecoverySetupType): boolean =>
        hasExistingMethod(type) || sessionConfigured.has(type);

    const anyConfigured =
        existingMethods.some(m => m.type !== 'email') || sessionConfigured.size > 0;

    // Default to the first unconfigured method in priority order:
    // email > phrase > backup > passkey
    const [activeTab, setActiveTab] = useState<RecoverySetupType>(() => {
        if (initialMethod && !isConfigured(initialMethod)) return initialMethod;
        if (!isConfigured('email')) return 'email';
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
    const [emailRecoveryCode, setEmailRecoveryCode] = useState('');

    const handleTabSwitch = (tab: RecoverySetupType) => {
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
            setSuccess(m['recovery.setup.success.passkey']());
            setShowUpdateForm(false);
            onCompleted?.('passkey');
        } catch (e) {
            log.error('handlePasskeySetup error', e);
            setError(e instanceof Error ? e.message : m['error.generic']());
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
            setPhraseChallengeWords(result.challengeWordIndices.map(() => ''));
            setPhraseChallengeStarted(false);
        } catch (e) {
            log.error('handleGeneratePhrase error', e);
            setError(e instanceof Error ? e.message : m['error.generic']());
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

    const handleConfirmPhrase = async () => {
        setLoading(true);
        setError(null);

        try {
            await onConfirmPhrase(phraseChallengeWords);
            markConfigured('phrase');
            setRecoveryPhrase(null);
            setPhraseChallengeStarted(false);
            setSuccess(m['recovery.setup.success.phrase']());
            setShowUpdateForm(false);
            onCompleted?.('phrase');
        } catch (e) {
            log.error('handleConfirmPhrase error', e);
            setError(toFriendlyConfirmError(e));
        } finally {
            setLoading(false);
        }
    };

    const handleBackupSetup = async () => {
        if (backupPassword.length < 8) {
            setError(m['recovery.setup.errors.passLength']());
            return;
        }

        if (backupPassword !== confirmBackupPassword) {
            setError(m['recovery.setup.errors.passMismatch']());
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
            setError(e instanceof Error ? e.message : m['error.generic']());
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBackup = async () => {
        if (!backupFileJson) return;

        const fileName = `scoutpass-backup-${new Date().toISOString().slice(0, 10)}.json`;

        if (Capacitor.isNativePlatform()) {
            try {
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: backupFileJson,
                    directory: Directory.Cache,
                    encoding: Encoding.UTF8,
                });

                await Share.share({
                    title: m['recovery.setup.backup.shareTitle'](),
                    url: result.uri,
                    dialogTitle: m['recovery.setup.backup.downloadBtn'](),
                });

                setBackupDownloaded(true);
            } catch (e) {
                log.error('Native file download failed', e);
                setError(m['recovery.setup.errors.downloadFailed']());
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
            setSuccess(m['recovery.setup.success.backup']());
            setBackupVerificationPassword('');
            setShowUpdateForm(false);
            onCompleted?.('backup');
        } catch (e) {
            log.error('handleConfirmBackup error', e);
            setError(toFriendlyConfirmError(e));
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmailCode = async () => {
        if (!emailInput.includes('@')) {
            setError(m['recovery.setup.errors.invalidEmail']());
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onAddRecoveryEmail(emailInput);
            setEmailCodeSent(true);
        } catch (e) {
            log.error('handleSendEmailCode error', e);
            setError(e instanceof Error ? e.message : m['error.generic']());
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmailCode = async () => {
        if (emailCode.length !== 6) {
            setError(m['recovery.setup.errors.codeLength']());
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
            setError(e instanceof Error ? e.message : m['recovery.setup.errors.incorrectCode']());
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
        } catch (e) {
            log.error('handleSetupEmailRecovery error', e);
            setError(e instanceof Error ? e.message : m['error.generic']());
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
            setSuccess(m['recovery.setup.success.email']());
            setShowUpdateForm(false);
            onCompleted?.('email');
        } catch (e) {
            log.error('handleConfirmEmailRecovery error', e);
            setError(toFriendlyConfirmError(e));
        } finally {
            setLoading(false);
        }
    };

    const allTabs = [
        {
            id: 'email' as const,
            label: m['recovery.setup.tabEmail'](),
            icon: mailOutline,
            iconClass: 'text-sm',
        },
        {
            id: 'phrase' as const,
            label: m['recovery.setup.tabPhrase'](),
            icon: documentTextOutline,
            iconClass: 'text-sm',
        },
        {
            id: 'backup' as const,
            label: m['recovery.setup.tabBackup'](),
            icon: cloudDownloadOutline,
            iconClass: 'text-sm',
        },
        {
            id: 'passkey' as const,
            label: m['recovery.setup.tabPasskey'](),
            icon: fingerPrint,
            iconClass: 'text-sm',
        },
    ];

    // Hide passkey tab entirely on native platforms (WebAuthn unavailable in WKWebView / Android WebView)
    const tabs = isNative ? allTabs.filter(t => t.id !== 'passkey') : allTabs;

    const configuredCount = tabs.filter(t => isConfigured(t.id)).length;

    // ── Shared helpers ──────────────────────────────────────────────

    const updateWarning = (text: string) => (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5">
            <IonIcon
                icon={alertCircleOutline}
                className="text-amber-500 text-base mt-0.5 shrink-0"
            />

            <span className="text-xs text-amber-700 leading-relaxed">{text}</span>
        </div>
    );

    const _ = updateWarning; // Used as a helper; actual warning texts are inline per section

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

    // Compact status row for a configured method
    const configuredRow = (statusText: string, onChangeClick: () => void) => (
        <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-grayscale-100/60">
            <div className="flex items-center gap-2.5">
                <IonIcon
                    icon={checkmarkCircleOutline}
                    className="text-emerald-500 text-base shrink-0"
                />

                <span className="text-sm text-grayscale-900">{statusText}</span>
            </div>

            <button
                onClick={onChangeClick}
                className="text-xs font-medium text-grayscale-500 hover:text-grayscale-900 transition-colors"
            >
                {m['recovery.setup.changeBtn']()}
            </button>
        </div>
    );

    // ── Render ─────────────────────────────────────────────────────────

    return (
        <div className="p-6 max-w-md mx-auto bg-white min-h-full">
            {/* Dynamic Header */}
            <div className="text-center mb-5">
                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    {anyConfigured
                        ? m['recovery.setup.titleExisting']()
                        : m['recovery.setup.titleNew']()}
                </h2>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {anyConfigured
                        ? m['recovery.setup.descMethodsActive']({ count: configuredCount })
                        : m['recovery.setup.descNew']()}
                </p>
            </div>

            {/* Tabs */}
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

                        {isConfigured(tab.id) && (
                            <IonIcon
                                icon={checkmarkCircleOutline}
                                className="text-emerald-400 text-sm"
                            />
                        )}
                    </button>
                ))}
            </div>

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

            {/* ── Passkey Tab ───────────────────────────────────── */}
            {activeTab === 'passkey' && (
                <div className="space-y-4">
                    {!webAuthnSupported ? (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                            <p className="text-sm text-amber-800 leading-relaxed">
                                {m['recovery.setup.passkey.notSupported']()}
                            </p>
                        </div>
                    ) : isConfigured('passkey') && !showUpdateForm ? (
                        configuredRow(m['recovery.setup.passkey.setUpRow'](), () =>
                            setShowUpdateForm(true)
                        )
                    ) : (
                        <>
                            {isUpdate && updateWarning(m['recovery.setup.passkey.updateWarning']())}

                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {m['recovery.setup.passkey.desc']()}
                            </p>

                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl">
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    {m['recovery.setup.passkey.chromeOnly']()}
                                </p>
                            </div>

                            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <div className="space-y-2.5 text-sm text-emerald-800">
                                    <div className="flex items-start gap-2.5">
                                        <IonIcon
                                            icon={fingerPrint}
                                            className="text-emerald-600 text-lg mt-0.5 shrink-0"
                                        />
                                        <span>{m['recovery.setup.passkey.bulletBiometric']()}</span>
                                    </div>

                                    <div className="flex items-start gap-2.5">
                                        <IonIcon
                                            icon={checkmarkCircleOutline}
                                            className="text-emerald-600 text-lg mt-0.5 shrink-0"
                                        />
                                        <span>
                                            {m['recovery.setup.passkey.bulletNoPassword']()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {primaryButton(
                                isUpdate
                                    ? m['recovery.setup.passkey.replaceBtn']()
                                    : m['recovery.setup.passkey.setupBtn'](),
                                handlePasskeySetup,
                                loading,
                                isUpdate
                                    ? m['recovery.setup.passkey.replacing']()
                                    : m['recovery.setup.passkey.settingUp']()
                            )}

                            {isUpdate && cancelUpdateButton()}
                        </>
                    )}
                </div>
            )}

            {/* ── Phrase Tab ────────────────────────────────────── */}
            {activeTab === 'phrase' && (
                <div className="space-y-4">
                    {isConfigured('phrase') && !showUpdateForm && !recoveryPhrase ? (
                        configuredRow(m['recovery.setup.phrase.savedRow'](), () =>
                            setShowUpdateForm(true)
                        )
                    ) : phraseChallengeStarted ? (
                        <>
                            <div>
                                <h3 className="text-sm font-semibold text-grayscale-900 mb-1">
                                    {m['recovery.setup.phrase.verifyTitle']?.() ??
                                        'Verify your phrase'}
                                </h3>
                                <p className="text-sm text-grayscale-600 leading-relaxed">
                                    {m['recovery.setup.phrase.verifyDesc']?.() ??
                                        'Please enter the requested words from your recovery phrase to confirm you have saved it.'}
                                </p>
                            </div>

                            {phraseChallengeWordIndices.map((wordIndex, challengeIndex) => (
                                <div key={wordIndex}>
                                    <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                        {m['recovery.setup.phrase.wordNumber']?.({
                                            number: wordIndex + 1,
                                        }) ?? `Word #${wordIndex + 1}`}
                                    </label>
                                    <input
                                        type="text"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        value={phraseChallengeWords[challengeIndex] ?? ''}
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
                            ))}

                            {primaryButton(
                                m['recovery.setup.phrase.confirmBtn'](),
                                handleConfirmPhrase,
                                loading || phraseChallengeWords.some(word => !word.trim()),
                                m['common.verifying']()
                            )}
                        </>
                    ) : !recoveryPhrase ? (
                        <>
                            {isUpdate && updateWarning(m['recovery.setup.phrase.updateWarning']())}

                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {m['recovery.setup.phrase.desc']()}
                            </p>

                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                <p className="text-sm font-medium text-amber-800 mb-2">
                                    {m['recovery.setup.phrase.keepSafe']()}
                                </p>

                                <ul className="text-sm text-amber-700 space-y-1.5">
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span>
                                            {m['recovery.setup.phrase.warningWritePaper']()}
                                        </span>
                                    </li>

                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span>
                                            {m['recovery.setup.phrase.warningNeverShare']()}
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            {primaryButton(
                                isUpdate
                                    ? m['recovery.setup.phrase.genNewBtn']()
                                    : m['recovery.setup.phrase.genBtn'](),
                                handleGeneratePhrase,
                                loading,
                                m['recovery.setup.phrase.generating']()
                            )}

                            {isUpdate && cancelUpdateButton()}
                        </>
                    ) : (
                        <>
                            <div className="p-4 bg-grayscale-900 rounded-2xl">
                                <p className="text-xs text-grayscale-400 mb-2 font-medium">
                                    {m['recovery.setup.phrase.yourPhrase']()}
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
                                    ? m['recovery.setup.phrase.copied']()
                                    : m['recovery.setup.phrase.copyBtn']()}
                            </button>

                            <button
                                onClick={() => setPhraseChallengeStarted(true)}
                                className="w-full py-3 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
                            >
                                {m['recovery.setup.phrase.confirmBtn']()}
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ── Backup Tab ──────────────────────────────────── */}
            {activeTab === 'backup' && (
                <div className="space-y-4">
                    {isConfigured('backup') && !showUpdateForm && !backupFileJson ? (
                        configuredRow(m['recovery.setup.backup.createdRow'](), () =>
                            setShowUpdateForm(true)
                        )
                    ) : !backupFileJson ? (
                        <>
                            {isUpdate && updateWarning(m['recovery.setup.backup.updateWarning']())}

                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {m['recovery.setup.backup.desc']()}
                            </p>

                            <div>
                                <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                    {m['recovery.setup.backup.passLabel']()}
                                </label>

                                <input
                                    type="password"
                                    value={backupPassword}
                                    onChange={e => setBackupPassword(e.target.value)}
                                    placeholder={m['recovery.setup.backup.passPlaceholder']()}
                                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                    {m['recovery.setup.backup.confirmLabel']()}
                                </label>

                                <input
                                    type="password"
                                    value={confirmBackupPassword}
                                    onChange={e => setConfirmBackupPassword(e.target.value)}
                                    placeholder={m['recovery.setup.backup.confirmPlaceholder']()}
                                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                />
                            </div>

                            {primaryButton(
                                isUpdate
                                    ? m['recovery.setup.backup.genNewBtn']()
                                    : m['recovery.setup.backup.genBtn'](),
                                handleBackupSetup,
                                loading || !backupPassword || !confirmBackupPassword,
                                m['recovery.setup.backup.generating']()
                            )}

                            {isUpdate &&
                                cancelUpdateButton(() => {
                                    setBackupPassword('');
                                    setConfirmBackupPassword('');
                                })}
                        </>
                    ) : (
                        <>
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <div className="flex items-start gap-2.5">
                                    <IonIcon
                                        icon={checkmarkCircleOutline}
                                        className="text-emerald-500 text-lg mt-0.5 shrink-0"
                                    />

                                    <div>
                                        <p className="text-sm font-medium text-emerald-800 mb-1">
                                            {m['recovery.setup.backup.readyTitle']()}
                                        </p>

                                        <p className="text-xs text-emerald-700 leading-relaxed">
                                            {m['recovery.setup.backup.readyDesc']()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleDownloadBackup}
                                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <IonIcon icon={cloudDownloadOutline} className="text-base" />
                                {backupDownloaded
                                    ? m['recovery.setup.backup.downloadAgain']()
                                    : m['recovery.setup.backup.downloadBtn']()}
                            </button>

                            {backupDownloaded && !backupConfirmed && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                            {m['recovery.setup.backup.reenterPassword']?.() ??
                                                'Re-enter password'}
                                        </label>
                                        <input
                                            type="password"
                                            value={backupVerificationPassword}
                                            onChange={event =>
                                                setBackupVerificationPassword(event.target.value)
                                            }
                                            placeholder={m[
                                                'recovery.setup.backup.confirmPlaceholder'
                                            ]()}
                                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                        />
                                        <p className="mt-1.5 text-xs text-grayscale-500">
                                            {m['recovery.setup.backup.verifyDesc']?.() ??
                                                'Enter the password you just created to verify your backup file.'}
                                        </p>
                                    </div>

                                    {primaryButton(
                                        m['recovery.setup.backup.confirmBtn'](),
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
                    {isConfigured('email') && !showUpdateForm ? (
                        configuredRow(
                            emailMasked
                                ? m['recovery.setup.email.recoveryRow']({ email: emailMasked })
                                : m['recovery.setup.email.setUpRow'](),
                            () => {
                                setShowUpdateForm(true);
                                // Reset email flow for re-setup
                                setEmailInput('');
                                setEmailCodeSent(false);
                                setEmailCode('');
                                setEmailVerified(false);
                                setEmailMasked('');
                                setEmailShareSent(false);
                            }
                        )
                    ) : !emailVerified ? (
                        // Step 1 & 2: Verify email
                        <>
                            {isUpdate && updateWarning(m['recovery.setup.email.updateWarning']())}

                            {!anyConfigured && (
                                <span className="inline-block text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                                    {m['recovery.setup.email.recommended']()}
                                </span>
                            )}

                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {m['recovery.setup.email.desc']()}
                            </p>

                            {!emailCodeSent ? (
                                // Step 1: Enter email
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                            {m['recovery.setup.email.emailLabel']()}
                                        </label>

                                        <input
                                            type="email"
                                            value={emailInput}
                                            onChange={e => setEmailInput(e.target.value)}
                                            placeholder={m[
                                                'recovery.setup.email.emailPlaceholder'
                                            ]()}
                                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                        />
                                    </div>

                                    {primaryButton(
                                        m['recovery.setup.email.sendCodeBtn'](),
                                        handleSendEmailCode,
                                        loading || !emailInput.includes('@'),
                                        m['recovery.setup.email.sending']()
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
                                            <TransP
                                                m={m['recovery.setup.email.codeSent']}
                                                values={{ email: emailInput }}
                                                components={[<strong key="b" />]}
                                            />
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                            {m['recovery.setup.email.codeLabel']()}
                                        </label>

                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={emailCode}
                                            onChange={e =>
                                                setEmailCode(
                                                    e.target.value.replace(/\D/g, '').slice(0, 6)
                                                )
                                            }
                                            placeholder={m[
                                                'recovery.setup.email.codePlaceholder'
                                            ]()}
                                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-center tracking-[0.3em] font-mono"
                                        />
                                    </div>

                                    {primaryButton(
                                        m['recovery.setup.email.verifyCodeBtn'](),
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
                                        {m['recovery.setup.email.differentEmail']()}
                                    </button>
                                </>
                            )}
                        </>
                    ) : !emailShareSent ? (
                        // Step 3: Email verified, send recovery share
                        <>
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
                                <IonIcon
                                    icon={checkmarkCircleOutline}
                                    className="text-emerald-500 text-lg mt-0.5 shrink-0"
                                />

                                <div>
                                    <p className="text-sm font-medium text-emerald-800">
                                        {m['recovery.setup.email.verifiedTitle']()}
                                    </p>

                                    <p className="text-xs text-emerald-700 mt-0.5">{emailMasked}</p>
                                </div>
                            </div>

                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {m['recovery.setup.email.sendKeyDesc']()}
                            </p>

                            {primaryButton(
                                m['recovery.setup.email.sendKeyBtn'](),
                                handleSetupEmailRecovery,
                                loading,
                                m['recovery.setup.email.sending']()
                            )}

                            {isUpdate && cancelUpdateButton()}
                        </>
                    ) : (
                        // Step 4: Confirm receipt of the recovery key
                        <>
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <p className="text-sm text-emerald-700 leading-relaxed">
                                    {m['recovery.setup.email.confirmationCodeSent']?.({
                                        email: emailMasked,
                                    }) ??
                                        `We sent a confirmation code to ${emailMasked}. Please enter it below to verify you received the recovery key.`}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                    {m['recovery.setup.email.codeLabel']()}
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={emailRecoveryCode}
                                    onChange={event =>
                                        setEmailRecoveryCode(
                                            event.target.value.replace(/\D/g, '').slice(0, 6)
                                        )
                                    }
                                    placeholder={m['recovery.setup.email.codePlaceholder']()}
                                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-center tracking-[0.3em] font-mono"
                                />
                            </div>

                            {primaryButton(
                                m['recovery.setup.email.confirmKeyBtn']?.() ??
                                    'Confirm Recovery Key',
                                handleConfirmEmailRecovery,
                                loading || emailRecoveryCode.length !== 6,
                                m['common.verifying']()
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Progress hint */}
            {anyConfigured && configuredCount < tabs.length && (
                <p className="mt-4 text-center text-xs text-grayscale-500 leading-relaxed">
                    {configuredCount === 1
                        ? m['recovery.setup.hintOneMissing']()
                        : m['recovery.setup.hintMore']()}
                </p>
            )}

            {/* Bottom action */}
            {!isActivationPending && (
                <div className="mt-6 pt-4 border-t border-grayscale-200">
                    <button
                        onClick={onClose}
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
