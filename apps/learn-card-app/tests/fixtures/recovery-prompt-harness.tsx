import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../src/index.scss';

import { AnalyticsContextProvider } from '../../src/analytics';
import RecoveryBanner from '../../src/components/recovery/RecoveryBanner';
import RecoverySetupModal, {
    type RecoverySetupType,
} from '../../src/components/recovery/RecoverySetupModal';
import { LocaleProvider } from '../../src/i18n';
import firstStartupStore from 'learn-card-base/stores/firstStartupStore';

type SetupOptions = {
    initialMethod: RecoverySetupType;
    onCompleted: (method: RecoverySetupType) => void;
    onClosed: () => void;
};

type RecoveryPromptHarnessApi = {
    getSnoozedUntil: () => number;
    legacyKeyExists: () => boolean;
    setSnoozedUntil: (value: number) => void;
};

declare global {
    interface Window {
        recoveryPromptHarness: RecoveryPromptHarnessApi;
    }
}

const params = new URLSearchParams(window.location.search);

window.recoveryPromptHarness = {
    getSnoozedUntil: () => firstStartupStore.get.recoveryPromptSnoozedUntil(),
    legacyKeyExists: () => localStorage.getItem('lc_recovery_banner_dismissed') !== null,
    setSnoozedUntil: value => firstStartupStore.set.recoveryPromptSnoozedUntil(value),
};

const parseCount = (): number | null => {
    const value = params.get('count') ?? '0';
    return value === 'null' ? null : Number(value);
};

const Harness: React.FC = () => {
    const completedOnPreviousLoad =
        localStorage.getItem('recovery-prompt-harness-completed') === 'true';
    const [recoveryMethodCount, setRecoveryMethodCount] = useState<number | null>(() =>
        completedOnPreviousLoad ? 1 : parseCount()
    );
    const [setupOptions, setSetupOptions] = useState<SetupOptions | null>(null);

    const handleCompleted = (method: RecoverySetupType): void => {
        setupOptions?.onCompleted(method);
        localStorage.setItem('recovery-prompt-harness-completed', 'true');
        setRecoveryMethodCount(1);
        setSetupOptions(null);
    };

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-[900px] flex-col gap-5 p-5 font-poppins">
            <div data-testid="quick-actions" className="rounded-[20px] bg-white p-4">
                Quick Actions
            </div>

            <RecoveryBanner
                recoverySupported={params.get('supported') !== '0'}
                recoveryMethodCount={recoveryMethodCount}
                totalCredentialCount={Number(params.get('credentials') ?? '1')}
                onSetup={setSetupOptions}
            />

            <div data-testid="dashboard-grid" className="grid grid-cols-2 gap-5">
                <div className="rounded-[20px] bg-white p-4">Dashboard column one</div>
                <div className="rounded-[20px] bg-white p-4">Dashboard column two</div>
            </div>

            {setupOptions && (
                <div
                    data-testid="recovery-setup-modal"
                    className="fixed inset-0 z-10 overflow-auto bg-white"
                >
                    <RecoverySetupModal
                        initialMethod={setupOptions.initialMethod}
                        onCompleted={handleCompleted}
                        existingMethods={[]}
                        maskedRecoveryEmail={null}
                        onSetupPasskey={async () => 'credential-id'}
                        onGeneratePhrase={async () => ({
                            phrase: 'one two three',
                            challengeWordIndices: [0, 2],
                        })}
                        onConfirmPhrase={async () => undefined}
                        onSetupBackup={async () => '{}'}
                        onConfirmBackup={async () => undefined}
                        onAddRecoveryEmail={async () => undefined}
                        onVerifyRecoveryEmail={async () => ({
                            maskedEmail: 'r***@example.com',
                        })}
                        onSetupEmailRecovery={async () => undefined}
                        onConfirmEmailRecovery={async () => undefined}
                        onClose={() => {
                            setupOptions.onClosed();
                            setSetupOptions(null);
                        }}
                    />
                </div>
            )}
        </main>
    );
};

const root = document.getElementById('root');

if (!root) throw new Error('Recovery prompt harness root not found');

createRoot(root).render(
    <AnalyticsContextProvider>
        <LocaleProvider>
            <Harness />
        </LocaleProvider>
    </AnalyticsContextProvider>
);
