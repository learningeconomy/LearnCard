import {
    findParsed,
    InboxError,
    type InboxStore,
    type ParsedMessage,
    type TrustPolicy,
} from '../tier3/inbox';

/**
 * lca-api's login-code email (`login-verification-code` template, rendered
 * locally by the Postmark adapter). It is sent by lca-api's tenant `login@`
 * mailbox, not the enclave sender, so it has its OWN trust policy: the sender
 * and DKIM domain are operator inputs per environment (never defaulted here),
 * and every `isTrusted` check still applies unchanged.
 *
 * The parser is strict and fails closed:
 * - subject exactly `Your <brand> login code`;
 * - exactly one standalone 6-digit run in the text part;
 * - that run is alone on its line;
 * - the previous non-empty line is exactly `Verification code`.
 * The text part starts with a whitespace-only line, so nothing is anchored to line 1.
 */
export interface LoginMailPolicy {
    sender: string;
    dkimDomain: string;
    requireDmarc: boolean;
}

export const loginTrustPolicy = (policy: LoginMailPolicy, email: string): TrustPolicy => ({
    expectedSenders: [policy.sender.toLowerCase()],
    expectedDkimDomain: policy.dkimDomain.toLowerCase(),
    requireDmarc: policy.requireDmarc,
    recoveryEmail: email,
});

export interface LoginCode {
    brand: string;
    code: string;
}

export const parseLoginCode = (message: ParsedMessage): LoginCode | undefined => {
    const subject = /^Your (.{1,64}) login code$/.exec(message.subject);
    if (!subject) return undefined;
    const digits = message.text.match(/(?<![0-9])[0-9]{6}(?![0-9])/g) ?? [];
    if (digits.length !== 1) throw new InboxError('malformed');
    const lines = message.text.split('\n').map(line => line.trim());
    const index = lines.findIndex(line => /(?<![0-9])[0-9]{6}(?![0-9])/.test(line));
    if (lines[index] !== digits[0]) throw new InboxError('malformed');
    const previous = lines
        .slice(0, index)
        .reverse()
        .find(line => line.length > 0);
    if (previous !== 'Verification code') throw new InboxError('malformed');
    return { brand: subject[1], code: digits[0] };
};

export interface WaitOptions {
    store: InboxStore;
    prefix: string;
    /** Only mail that arrived at or after the send. */
    since: number;
    policy: TrustPolicy;
    timeoutMs: number;
    pollMs: number;
    now: () => number;
    sleep: (ms: number) => Promise<void>;
}
export interface WaitResult {
    code?: string;
    untrusted: number;
    malformed: number;
}

/** Poll the prefix; the newest trusted login mail wins (each send replaces the code). */
export const waitForLoginCode = async (options: WaitOptions): Promise<WaitResult> => {
    const deadline = options.now() + options.timeoutMs;
    let untrusted = 0;
    let malformed = 0;
    for (;;) {
        const result = await findParsed(
            options.store,
            options.prefix,
            options.since,
            options.policy,
            parseLoginCode
        );
        untrusted = Math.max(untrusted, result.untrusted);
        malformed = Math.max(malformed, result.malformed);
        if (result.found) return { code: result.found.value.code, untrusted, malformed };
        if (options.now() + options.pollMs > deadline) return { untrusted, malformed };
        await options.sleep(options.pollMs);
    }
};
