import React, { useState } from 'react';
import { IonButton, IonIcon, IonInput, IonItem, IonLabel, IonSpinner, IonTextarea } from '@ionic/react';
import { keyOutline, fingerPrint, documentTextOutline, alertCircle, cloudUploadOutline, phonePortraitOutline } from 'ionicons/icons';
import { QRCodeSVG } from 'qrcode.react';

import { Capacitor } from '@capacitor/core';
import { isWebAuthnSupported } from '@learncard/sss-key-manager';
import { QrLoginRequester, getAuthConfig } from 'learn-card-base';

export type RecoveryFlowType = 'password' | 'passkey' | 'phrase' | 'backup' | 'device';

interface RecoveryFlowModalProps {
    availableMethods: { type: string; credentialId?: string; createdAt: string }[];
    onRecoverWithPassword: (password: string) => Promise<void>;
    onRecoverWithPasskey: (credentialId: string) => Promise<void>;
    onRecoverWithPhrase: (phrase: string) => Promise<void>;
    onRecoverWithBackup: (fileContents: string, password: string) => Promise<void>;
    onRecoverWithDevice?: (deviceShare: string) => Promise<void>;
    onCancel: () => void;
}

export const RecoveryFlowModal: React.FC<RecoveryFlowModalProps> = ({
    availableMethods,
    onRecoverWithPassword,
    onRecoverWithPasskey,
    onRecoverWithPhrase,
    onRecoverWithBackup,
    onRecoverWithDevice,
    onCancel,
}) => {
    const [activeMethod, setActiveMethod] = useState<RecoveryFlowType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [password, setPassword] = useState('');
    const [phrase, setPhrase] = useState('');
    const [backupFile, setBackupFile] = useState<string | null>(null);
    const [backupPassword, setBackupPassword] = useState('');

    const hasMethod = (type: string) => availableMethods.some(m => m.type === type);
    const webAuthnSupported = isWebAuthnSupported();

    const handlePasswordRecovery = async () => {
        if (!password) {
            setError('Please enter your recovery password');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onRecoverWithPassword(password);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Recovery failed');
            setLoading(false);
        }
    };

    const handlePasskeyRecovery = async () => {
        const passkeyMethod = availableMethods.find(m => m.type === 'passkey');
        if (!passkeyMethod?.credentialId) {
            setError('No passkey credential found');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onRecoverWithPasskey(passkeyMethod.credentialId);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Recovery failed');
            setLoading(false);
        }
    };

    const handlePhraseRecovery = async () => {
        const words = phrase.trim().split(/\s+/);
        if (words.length < 12) {
            setError('Recovery phrase must be at least 12 words');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onRecoverWithPhrase(phrase.trim());
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Recovery failed');
            setLoading(false);
        }
    };

    const handleBackupRecovery = async () => {
        if (!backupFile) {
            setError('Please select a backup file');
            return;
        }

        if (!backupPassword) {
            setError('Please enter the backup file password');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onRecoverWithBackup(backupFile, backupPassword);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Recovery failed');
            setLoading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setBackupFile(e.target?.result as string);
            };
            reader.readAsText(file);
        }
    };

    const allMethods = [
        { id: 'password' as const, label: 'Password', icon: keyOutline, available: hasMethod('password') },
        { id: 'passkey' as const, label: 'Passkey', icon: fingerPrint, available: hasMethod('passkey') && webAuthnSupported },
        { id: 'phrase' as const, label: 'Recovery Phrase', icon: documentTextOutline, available: hasMethod('phrase') },
        { id: 'backup' as const, label: 'Backup File', icon: cloudUploadOutline, available: hasMethod('backup') },
        { id: 'device' as const, label: 'Another Device', icon: phonePortraitOutline, available: !!onRecoverWithDevice },
    ];

    // Hide passkey entirely on native platforms (WebAuthn unavailable in WKWebView / Android WebView)
    const methods = Capacitor.isNativePlatform()
        ? allMethods.filter(m => m.id !== 'passkey')
        : allMethods;

    if (!activeMethod) {
        return (
            <div className="p-4 max-w-md mx-auto">
                <h2 className="text-xl font-bold mb-2 text-center">Recover Your Account</h2>

                <p className="text-sm text-gray-600 mb-6 text-center">
                    Choose a recovery method to restore access to your wallet.
                </p>

                <div className="space-y-3">
                    {methods.map(method => (
                        <button
                            key={method.id}
                            onClick={() => method.available && setActiveMethod(method.id)}
                            disabled={!method.available}
                            className={`w-full p-4 rounded-lg flex items-center gap-4 transition-colors ${
                                method.available
                                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                method.available ? 'bg-purple-100' : 'bg-gray-200'
                            }`}>
                                <IonIcon icon={method.icon} className={method.available ? 'text-purple-600' : 'text-gray-400'} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium">{method.label}</p>
                                <p className="text-xs text-gray-500">
                                    {method.available ? 'Available' : 'Not configured'}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-6">
                    <IonButton expand="block" fill="outline" onClick={onCancel}>
                        Cancel
                    </IonButton>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <button
                onClick={() => {
                    setActiveMethod(null);
                    setError(null);
                }}
                className="text-sm text-purple-600 mb-4"
            >
                ← Back to methods
            </button>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <IonIcon icon={alertCircle} className="text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                </div>
            )}

            {activeMethod === 'password' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Recover with Password</h3>

                    <p className="text-sm text-gray-600">
                        Enter the recovery password you set up previously.
                    </p>

                    <IonItem>
                        <IonLabel position="stacked">Recovery Password</IonLabel>
                        <IonInput
                            type="password"
                            value={password}
                            onIonChange={e => setPassword(e.detail.value || '')}
                            placeholder="Enter your recovery password"
                        />
                    </IonItem>

                    <IonButton
                        expand="block"
                        onClick={handlePasswordRecovery}
                        disabled={loading || !password}
                    >
                        {loading ? <IonSpinner name="crescent" /> : 'Recover Account'}
                    </IonButton>
                </div>
            )}

            {activeMethod === 'passkey' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Recover with Passkey</h3>

                    <p className="text-sm text-gray-600">
                        Use your device's biometric authentication to recover.
                    </p>

                    <div className="p-6 bg-purple-50 rounded-lg text-center">
                        <IonIcon icon={fingerPrint} className="text-5xl text-purple-600 mb-4" />
                        <p className="text-sm text-purple-800">
                            Click below to authenticate with your passkey
                        </p>
                    </div>

                    <IonButton
                        expand="block"
                        onClick={handlePasskeyRecovery}
                        disabled={loading}
                    >
                        {loading ? <IonSpinner name="crescent" /> : 'Authenticate with Passkey'}
                    </IonButton>
                </div>
            )}

            {activeMethod === 'phrase' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Recover with Phrase</h3>

                    <p className="text-sm text-gray-600">
                        Enter your 25-word recovery phrase, separated by spaces.
                    </p>

                    <IonItem>
                        <IonLabel position="stacked">Recovery Phrase</IonLabel>
                        <IonTextarea
                            value={phrase}
                            onIonChange={e => setPhrase(e.detail.value || '')}
                            placeholder="Enter your 25-word recovery phrase..."
                            rows={4}
                            className="font-mono"
                        />
                    </IonItem>

                    <p className="text-xs text-gray-500">
                        Words: {phrase.trim() ? phrase.trim().split(/\s+/).length : 0} / 25
                    </p>

                    <IonButton
                        expand="block"
                        onClick={handlePhraseRecovery}
                        disabled={loading || phrase.trim().split(/\s+/).length < 12}
                    >
                        {loading ? <IonSpinner name="crescent" /> : 'Recover Account'}
                    </IonButton>
                </div>
            )}

            {activeMethod === 'device' && onRecoverWithDevice && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Recover from Another Device</h3>

                    <p className="text-sm text-gray-600">
                        Scan the QR code below with a device that's already signed in to your account.
                    </p>

                    <QrLoginRequester
                        serverUrl={getAuthConfig().serverUrl}
                        onApproved={async (deviceShare) => {
                            setLoading(true);
                            setError(null);

                            try {
                                await onRecoverWithDevice(deviceShare);
                            } catch (e) {
                                setError(e instanceof Error ? e.message : 'Recovery failed');
                                setLoading(false);
                            }
                        }}
                        onCancel={() => {
                            setActiveMethod(null);
                            setError(null);
                        }}
                        renderQrCode={(data) => (
                            <QRCodeSVG value={data} size={192} level="M" />
                        )}
                    />
                </div>
            )}

            {activeMethod === 'backup' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Recover with Backup File</h3>

                    <p className="text-sm text-gray-600">
                        Upload your backup file and enter its password.
                    </p>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="backup-file-input"
                        />
                        <label htmlFor="backup-file-input" className="cursor-pointer">
                            <IonIcon icon={cloudUploadOutline} className="text-4xl text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">
                                {backupFile ? '✓ File selected' : 'Click to select backup file'}
                            </p>
                        </label>
                    </div>

                    <IonItem>
                        <IonLabel position="stacked">Backup Password</IonLabel>
                        <IonInput
                            type="password"
                            value={backupPassword}
                            onIonChange={e => setBackupPassword(e.detail.value || '')}
                            placeholder="Enter backup file password"
                        />
                    </IonItem>

                    <IonButton
                        expand="block"
                        onClick={handleBackupRecovery}
                        disabled={loading || !backupFile || !backupPassword}
                    >
                        {loading ? <IonSpinner name="crescent" /> : 'Recover Account'}
                    </IonButton>
                </div>
            )}
        </div>
    );
};

export default RecoveryFlowModal;
