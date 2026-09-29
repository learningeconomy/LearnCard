export type RecoverySetupAction = <T>(method: string, action: () => Promise<T>) => Promise<T>;

export interface PasskeySetupResult {
    method: string;
    credentialId?: string;
}

/** Run passkey setup; the shared recovery runner owns provisional activation. */
export const runPasskeyRecoverySetup = async (
    runRecoverySetup: RecoverySetupAction,
    setupPasskey: () => Promise<PasskeySetupResult>
): Promise<string> => {
    const result = await runRecoverySetup('passkey', setupPasskey);
    return result.method === 'passkey' ? (result.credentialId ?? '') : '';
};
