import fs from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import { type VC, type VP, type VerificationCheck, type VerificationItem } from '@learncard/types';

import { out } from './out';

export type VerifyResult = VerificationCheck | VerificationItem[];

export const isPresentation = (value: unknown): boolean => {
    if (!value || typeof value !== 'object' || !('type' in value)) return false;
    const types = Array.isArray(value.type) ? value.type : [value.type];
    return types.includes('VerifiablePresentation');
};

const checkName = (value: string): string => (value === 'signature' ? 'proof' : value);

export const verificationFailed = (result: VerifyResult): boolean =>
    Array.isArray(result)
        ? result.some(item => item.status === 'Failed')
        : result.errors.length > 0;

export const formatVerification = (result: VerifyResult): string[] => {
    if (Array.isArray(result))
        return result.map(item => {
            const check = checkName(item.check);
            if (item.status === 'Success') return `✓ ${check}`;
            return `${item.status === 'Failed' ? '✗' : '!'} ${check}: ${item.details || item.message || 'Check failed'}`;
        });
    return [
        ...result.checks.map(check => `✓ ${checkName(check)}`),
        ...result.warnings.map(warning => `! ${warning}`),
        ...result.errors.map(error => {
            const match = error.match(/^(.+?) error:\s*(.*)$/);
            return match ? `✗ ${checkName(match[1]!)}: ${match[2]}` : `✗ ${error}`;
        }),
    ];
};

export const runVerify = async (
    file: string,
    options: { json?: boolean; didkit?: Promise<Buffer> }
): Promise<void> => {
    let text: string;
    if (file === '-') {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
        text = Buffer.concat(chunks).toString('utf8');
    } else text = await fs.readFile(file, 'utf8');
    let input: unknown;
    try {
        input = JSON.parse(text);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid JSON in ${file === '-' ? 'stdin' : file}: ${message}`, {
            cause: error,
        });
    }
    if (!input || typeof input !== 'object' || !('type' in input))
        throw new Error('Expected a credential or presentation JSON object with a type.');
    const presentation = isPresentation(input);
    const types = Array.isArray(input.type) ? input.type : [input.type];
    if (!presentation && !types.includes('VerifiableCredential'))
        throw new Error('Expected VerifiableCredential or VerifiablePresentation in type.');
    const learnCard = await initLearnCard({ ...(options.didkit && { didkit: options.didkit }) });
    const result = presentation
        ? await learnCard.invoke.verifyPresentation(input as VP)
        : options.json
          ? await learnCard.invoke.verifyCredential(input as VC)
          : await learnCard.invoke.verifyCredential(input as VC, {}, true);
    const verified = !verificationFailed(result);
    // --json: runCommand prints one line, {ok:true, command:'verify', verified, result}.
    // `ok` means the command ran; `verified` is the verdict.
    if (options.json) out.set({ verified, result });
    else {
        for (const line of formatVerification(result)) console.log(line);
        console.log('Next: review warnings and issuer trust before accepting this credential.');
    }
    if (!verified) process.exitCode = 1;
};
