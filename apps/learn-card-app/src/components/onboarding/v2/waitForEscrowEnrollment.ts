export type EscrowEnrollmentSnapshot = {
    status: string;
    escrowEnrollment?: string;
};

/**
 * Background enrollment starts when a new account becomes ready and takes a
 * few seconds (vault verification + authority write). Onboarding asks once,
 * at the end of the profile step, whether to offer a PIN — so wait briefly for
 * the live answer instead of deciding from a stale or not-yet-published state.
 * Returns immediately when escrow is off, so tenants without it never wait.
 */
export const waitForEscrowEnrollment = async (
    getState: () => EscrowEnrollmentSnapshot,
    {
        escrowEnabled,
        timeoutMs = 15_000,
        intervalMs = 250,
    }: { escrowEnabled: boolean; timeoutMs?: number; intervalMs?: number }
): Promise<boolean> => {
    const enrolled = () => {
        const state = getState();
        return state.status === 'ready' && state.escrowEnrollment === 'enrolled';
    };
    const settled = () => {
        const state = getState();
        return state.status !== 'ready' || state.escrowEnrollment !== undefined;
    };
    if (!escrowEnabled || settled()) return enrolled();
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        if (settled()) break;
    }
    return enrolled();
};
