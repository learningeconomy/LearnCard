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
import { getLogger } from 'learn-card-base';

const log = getLogger('recovery-setup-modal');

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
    onClose,
}) => {
    const webAuthnSupported = isWebAuthnSupported();
    const isNative = Capacitor.isNativePlatform();

    const hasExistingMethod = (type: string) => existingMethods.some(m => m.type === type);

    // Track methods configured during this modal session (persists across tab switches)
    const [sessionConfigured, setSessionConfigured] = useState<Set<RecoverySetupType>>(new Set());

    const isConfigured = (type: RecoverySetupType): boolean =>
        hasExistingMethod(type) || sessionConfigured.has(type);

    const anyConfigured = existingMethods.length > 0 || sessionConfigured.size > 0;

    // Default to the first unconfigured method in priority order:
    // email > phrase > backup > passkey
    const [activeTab, setActiveTab] = useState<RecoverySetupType>(() => {
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
            setSuccess(m['recovery.success.passkeySetup']());
            setShowUpdateForm(false);
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
            setPhraseChallengeWords(result.challengeWordIndices.map(() => ''));
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
        } catch (e) {
            log.error('handleConfirmPhrase error', e);
            setError(e instanceof Error ? e.message : m['recovery.phraseWordsMismatch']());
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
        } catch (e) {
            log.error('handleConfirmBackup error', e);
            setError(e instanceof Error ? e.message : m['recovery.incorrectPassword']());
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
            setSuccess(m['recovery.success.recoveryKeySent']());
            setShowUpdateForm(false);
        } catch (e) {
            log.error('handleConfirmEmailRecovery error', e);
            setError(e instanceof Error ? e.message : m['recovery.incorrectCode']());
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

    // Compact status row for a configured method — replaces the old large green card + button
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
                {m['recovery.action.change']()}
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
                                {m['recovery.passkeyNotSupported']()}
                            </p>
                        </div>
                    ) : isConfigured('passkey') && !showUpdateForm ? (
                        configuredRow(m['recovery.method.passkeySetup'](), () =>
                            setShowUpdateForm(true)
                        )
                    ) : phraseChallengeStarted ? (
                        <>
                            <div>
                                <h3 className="text-sm font-semibold text-grayscale-900 mb-1">
                                    {m['recovery.verifyPhraseTitle']()}
                                </h3>
                                <p className="text-sm text-grayscale-600 leading-relaxed">
                                    {m['recovery.verifyPhraseDescription']()}
                                </p>
                            </div>

                            {phraseChallengeWordIndices.map((wordIndex, challengeIndex) => (
                                <div key={wordIndex}>
                                    <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                        {m['recovery.wordNumber']({ number: wordIndex + 1 })}
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
                                m['recovery.confirmPhrase'](),
                                handleConfirmPhrase,
                                loading || phraseChallengeWords.some(word => !word.trim()),
                                m['common.verifying']()
                            )}
                        </>
                    ) : (
                        <>
                            {isUpdate && updateWarning(m['recovery.replacePasskey']())}

                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {m['recovery.passkeyUseFaceId']()}
                            </p>

                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl">
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    {m['recovery.passkeyDesktopOnly']()}
                                </p>
                            </div>

                            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <div className="space-y-2.5 text-sm text-emerald-800">
                                    <div className="flex items-start gap-2.5">
                                        <IonIcon
                                            icon={fingerPrint}
                                            className="text-emerald-600 text-lg mt-0.5 shrink-0"
                                        />
                                        <span>{m['recovery.passkeyBiometric']()}</span>
                                    </div>

                                    <div className="flex items-start gap-2.5">
                                        <IonIcon
                                            icon={checkmarkCircleOutline}
                                            className="text-emerald-600 text-lg mt-0.5 shrink-0"
                                        />
                                        <span>{m['recovery.passkeyNoPassword']()}</span>
                                    </div>
                                </div>
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
                    {isConfigured('phrase') && !showUpdateForm && !recoveryPhrase ? (
                        configuredRow(m['recovery.method.phraseSaved'](), () =>
                            setShowUpdateForm(true)
                        )
                    ) : !recoveryPhrase ? (
                        <>
                            {isUpdate && updateWarning(m['recovery.generateNewPhrase']())}

                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {m['recovery.phraseDescription']()}
                            </p>

                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                <p className="text-sm font-medium text-amber-800 mb-2">
                                    {m['recovery.phraseKeepSafe']()}
                                </p>

                                <ul className="text-sm text-amber-700 space-y-1.5">
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span>{m['recovery.phraseWriteOnPaper']()}</span>
                                    </li>

                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span>{m['recovery.phraseNeverShare']()}</span>
                                    </li>
                                </ul>
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
                                {m['recovery.savedSomewhereSafe']()}
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ── Backup Tab ──────────────────────────────────── */}
            {activeTab === 'backup' && (
                <div className="space-y-4">
                    {isConfigured('backup') && !showUpdateForm && !backupFileJson ? (
                        configuredRow(m['recovery.backupCreated'](), () => setShowUpdateForm(true))
                    ) : !backupFileJson ? (
                        <>
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
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <div className="flex items-start gap-2.5">
                                    <IonIcon
                                        icon={checkmarkCircleOutline}
                                        className="text-emerald-500 text-lg mt-0.5 shrink-0"
                                    />

                                    <div>
                                        <p className="text-sm font-medium text-emerald-800 mb-1">
                                            {m['recovery.backupReady']()}
                                        </p>

                                        <p className="text-xs text-emerald-700 leading-relaxed">
                                            {m['recovery.backupReadyDesc']()}
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
                                    ? m['recovery.action.downloadAgain']()
                                    : m['recovery.action.downloadBackup']()}
                            </button>

                            {backupDownloaded && !backupConfirmed && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                                            {m['recovery.reenterPassword']()}
                                        </label>
                                        <input
                                            type="password"
                                            value={backupVerificationPassword}
                                            onChange={event =>
                                                setBackupVerificationPassword(event.target.value)
                                            }
                                            placeholder={m['recovery.placeholder.typeAgain']()}
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
                    {isConfigured('email') && !showUpdateForm ? (
                        configuredRow(
                            emailMasked
                                ? `Recovery email: ${emailMasked}`
                                : m['recovery.method.emailSetup'](),
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
                                                    e.target.value.replace(/\D/g, '').slice(0, 6)
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
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
                                <IonIcon
                                    icon={checkmarkCircleOutline}
                                    className="text-emerald-500 text-lg mt-0.5 shrink-0"
                                />

                                <div>
                                    <p className="text-sm font-medium text-emerald-800">
                                        {m['recovery.emailVerified']()}
                                    </p>

                                    <p className="text-xs text-emerald-700 mt-0.5">{emailMasked}</p>
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
                                            event.target.value.replace(/\D/g, '').slice(0, 6)
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

            {/* Progress hint */}
            {anyConfigured && configuredCount < tabs.length && (
                <p className="mt-4 text-center text-xs text-grayscale-500 leading-relaxed">
                    {configuredCount === 1
                        ? m['recovery.recommendTwo']()
                        : m['recovery.addingMethod']()}
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
