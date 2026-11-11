interface DigitalResult extends Credential {
    protocol: string;
    data: unknown;
}
interface RequestEntry {
    protocol: string;
    data: Record<string, unknown>;
}
const requestButton = document.querySelector<HTMLButtonElement>('#request')!;
const cancelButton = document.querySelector<HTMLButtonElement>('#cancel')!;
const statusElement = document.querySelector<HTMLParagraphElement>('#status')!;
let prepared: RequestEntry | undefined;
let expiresAt = 0;
let abort: AbortController | undefined;
const report = (text: string, error = false) => {
    statusElement.textContent = text;
    statusElement.className = error ? 'status error' : 'status';
};
const prepare = async (initial = false) => {
    prepared = undefined;
    requestButton.disabled = true;
    requestButton.textContent = 'Preparing request...';
    try {
        const response = await fetch('/api/request', { method: 'POST' });
        const result = await response.json();
        if (!response.ok) throw new Error('Request unavailable');
        prepared = result.request;
        expiresAt = result.expiresAt;
        if (initial) report('Ready to request a synthetic course credential.');
        requestButton.disabled = false;
    } catch {
        report('Could not prepare a request. Reload to try again.', true);
    } finally {
        requestButton.textContent = 'Request Course Details';
    }
};
if (!window.isSecureContext || !('DigitalCredential' in window)) {
    report('Use a current stable Chrome on Android with Digital Credentials API support.', true);
} else {
    void prepare(true);
    requestButton.addEventListener('click', async () => {
        if (!prepared || abort) return;
        delete statusElement.dataset.verified;
        if (Date.now() >= expiresAt) {
            void prepare(true);
            return;
        }
        const request = prepared;
        prepared = undefined;
        abort = new AbortController();
        requestButton.disabled = true;
        requestButton.textContent = 'Waiting for approval...';
        cancelButton.hidden = false;
        report('Choose the synthetic sample in Android, then review the request in LearnCard.');
        try {
            // Call directly in the click handler: no fetch/await before the user-activated API.
            const credential = (await navigator.credentials.get({
                digital: { requests: [request] },
                signal: abort.signal,
            } as CredentialRequestOptions)) as DigitalResult | null;
            if (!credential) throw new Error('No credential');
            cancelButton.hidden = true;
            requestButton.textContent = 'Verifying response...';
            report('Checking the returned proof with the independent verifier.');
            const response = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ protocol: credential.protocol, data: credential.data }),
            });
            const result = await response.json();
            if (!response.ok || result.verified !== true) throw new Error('Verification failed');
            report('Verified by independent verifier. Course name and Completion date checked.');
            statusElement.dataset.verified = 'true';
        } catch (error) {
            delete statusElement.dataset.verified;
            const canceled =
                error instanceof DOMException &&
                ['AbortError', 'NotAllowedError'].includes(error.name);
            report(
                canceled
                    ? 'Canceled. No credential was received.'
                    : 'Request failed. No verified credential was received.',
                !canceled
            );
            await fetch('/api/cancel', { method: 'POST' }).catch(() => undefined);
        } finally {
            abort = undefined;
            cancelButton.hidden = true;
            await prepare();
        }
    });
    cancelButton.addEventListener('click', () => abort?.abort());
}
