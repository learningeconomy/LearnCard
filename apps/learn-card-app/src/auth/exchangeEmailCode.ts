import { requestEmailOtpTicket } from './keycloakTickets';

interface EmailCodeResult {
    success: boolean;
    token?: string;
    message?: string;
}

/** Keep the legacy exchange unchanged while Keycloak consumes the code as a ticket. */
export const exchangeEmailCode = async (
    providerType: string,
    input: { email: string; code: string },
    verifyFirebaseCode: (input: { email: string; code: string }) => Promise<EmailCodeResult>
): Promise<EmailCodeResult> => {
    if (providerType === 'keycloak') {
        return { success: true, token: await requestEmailOtpTicket(input.email, input.code) };
    }
    return verifyFirebaseCode(input);
};
