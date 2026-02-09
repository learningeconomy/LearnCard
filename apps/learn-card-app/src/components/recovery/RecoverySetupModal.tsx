import React, { useState } from 'react';
import { IonButton, IonIcon, IonInput, IonItem, IonLabel, IonSpinner, IonText } from '@ionic/react';
import { keyOutline, fingerPrint, documentTextOutline, checkmarkCircle, alertCircle, copyOutline, checkmark } from 'ionicons/icons';

import { Capacitor } from '@capacitor/core';
import { isWebAuthnSupported } from '@learncard/sss-key-manager';

export type RecoverySetupType = 'password' | 'passkey' | 'phrase';

interface RecoverySetupModalProps {
    onSetupPassword: (password: string) => Promise<void>;
    onSetupPasskey: () => Promise<string>;
    onGeneratePhrase: () => Promise<string>;
    existingMethods: { type: string; createdAt: string }[];
    onClose: () => void;
}

export const RecoverySetupModal: React.FC<RecoverySetupModalProps> = ({
    onSetupPassword,
    onSetupPasskey,
    onGeneratePhrase,
    existingMethods,
    onClose,
}) => {
    const [activeTab, setActiveTab] = useState<RecoverySetupType>('password');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);
    const [phraseCopied, setPhraseCopied] = useState(false);
    const [phraseConfirmed, setPhraseConfirmed] = useState(false);

    const hasMethod = (type: string) => existingMethods.some(m => m.type === type);
    const webAuthnSupported = isWebAuthnSupported();

    const handlePasswordSetup = async () => {
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onSetupPassword(password);
            setSuccess('Password recovery set up successfully!');
            setPassword('');
            setConfirmPassword('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to set up password recovery');
        } finally {
            setLoading(false);
        }
    };

    const handlePasskeySetup = async () => {
        setLoading(true);
        setError(null);

        try {
            await onSetupPasskey();
            setSuccess('Passkey recovery set up successfully!');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to set up passkey recovery');
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePhrase = async () => {
        setLoading(true);
        setError(null);

        try {
            const phrase = await onGeneratePhrase();
            setRecoveryPhrase(phrase);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to generate recovery phrase');
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

    const handleConfirmPhrase = () => {
        setPhraseConfirmed(true);
        setSuccess('Recovery phrase saved! Store it securely and never share it.');
    };

    const allTabs = [
        { id: 'password' as const, label: 'Password', icon: keyOutline },
        { id: 'passkey' as const, label: 'Passkey', icon: fingerPrint },
        { id: 'phrase' as const, label: 'Phrase', icon: documentTextOutline },
    ];

    // Hide passkey tab entirely on native platforms (WebAuthn unavailable in WKWebView / Android WebView)
    const tabs = Capacitor.isNativePlatform()
        ? allTabs.filter(t => t.id !== 'passkey')
        : allTabs;

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-center">Set Up Recovery</h2>

            <p className="text-sm text-gray-600 mb-4 text-center">
                Add recovery methods to regain access if you lose your device.
            </p>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Setting up a recovery method will log you out of any other devices and <strong>replace any existing recovery methods</strong>. Only your most recent recovery method will work.
                </p>
            </div>

            <div className="flex gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setError(null);
                            setSuccess(null);
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors ${
                            activeTab === tab.id
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <IonIcon icon={tab.icon} />
                        {tab.label}
                        {hasMethod(tab.id) && (
                            <IonIcon icon={checkmarkCircle} className="text-green-400" />
                        )}
                    </button>
                ))}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <IonIcon icon={alertCircle} className="text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <IonIcon icon={checkmarkCircle} className="text-green-500" />
                    <span className="text-sm text-green-700">{success}</span>
                </div>
            )}

            {activeTab === 'password' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Create a recovery password. You'll need this password plus access to your account to recover.
                    </p>

                    <IonItem>
                        <IonLabel position="stacked">Recovery Password</IonLabel>
                        <IonInput
                            type="password"
                            value={password}
                            onIonChange={e => setPassword(e.detail.value || '')}
                            placeholder="Enter a strong password"
                        />
                    </IonItem>

                    <IonItem>
                        <IonLabel position="stacked">Confirm Password</IonLabel>
                        <IonInput
                            type="password"
                            value={confirmPassword}
                            onIonChange={e => setConfirmPassword(e.detail.value || '')}
                            placeholder="Confirm your password"
                        />
                    </IonItem>

                    <IonButton
                        expand="block"
                        onClick={handlePasswordSetup}
                        disabled={loading || !password || !confirmPassword}
                    >
                        {loading ? <IonSpinner name="crescent" /> : 'Set Up Password Recovery'}
                    </IonButton>
                </div>
            )}

            {activeTab === 'passkey' && (
                <div className="space-y-4">
                    {!webAuthnSupported ? (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                Passkey recovery is not supported on this device or browser.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-600">
                                Use your device's biometric authentication (Face ID, Touch ID, Windows Hello) as a recovery method.
                            </p>

                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <h4 className="font-medium text-purple-800 mb-2">How it works:</h4>
                                <ul className="text-sm text-purple-700 space-y-1">
                                    <li>• Uses your device's secure authentication</li>
                                    <li>• No password to remember</li>
                                    <li>• Works only on this device</li>
                                </ul>
                            </div>

                            <IonButton
                                expand="block"
                                onClick={handlePasskeySetup}
                                disabled={loading}
                            >
                                {loading ? <IonSpinner name="crescent" /> : 'Set Up Passkey Recovery'}
                            </IonButton>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'phrase' && (
                <div className="space-y-4">
                    {!recoveryPhrase ? (
                        <>
                            <p className="text-sm text-gray-600">
                                Generate a 25-word recovery phrase. Write it down and store it securely - it's the only way to recover without your device.
                            </p>

                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important:</h4>
                                <ul className="text-sm text-yellow-700 space-y-1">
                                    <li>• Write down the phrase on paper</li>
                                    <li>• Never share it with anyone</li>
                                    <li>• Never store it digitally</li>
                                    <li>• Anyone with this phrase can access your wallet</li>
                                </ul>
                            </div>

                            <IonButton
                                expand="block"
                                onClick={handleGeneratePhrase}
                                disabled={loading}
                            >
                                {loading ? <IonSpinner name="crescent" /> : 'Generate Recovery Phrase'}
                            </IonButton>
                        </>
                    ) : (
                        <>
                            <div className="p-4 bg-gray-900 rounded-lg">
                                <p className="text-sm text-gray-400 mb-2">Your Recovery Phrase:</p>
                                <p className="font-mono text-sm text-white leading-relaxed break-words">
                                    {recoveryPhrase}
                                </p>
                            </div>

                            <button
                                onClick={handleCopyPhrase}
                                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-2 text-sm"
                            >
                                <IonIcon icon={phraseCopied ? checkmark : copyOutline} />
                                {phraseCopied ? 'Copied!' : 'Copy to Clipboard'}
                            </button>

                            {!phraseConfirmed && (
                                <IonButton
                                    expand="block"
                                    color="success"
                                    onClick={handleConfirmPhrase}
                                >
                                    I've Written It Down
                                </IonButton>
                            )}
                        </>
                    )}
                </div>
            )}

            <div className="mt-6 pt-4 border-t">
                <IonButton expand="block" fill="outline" onClick={onClose}>
                    Close
                </IonButton>
            </div>
        </div>
    );
};

export default RecoverySetupModal;
