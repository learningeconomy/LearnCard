import fs from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import { type VC, type VP, type VerificationCheck, type VerificationItem } from '@learncard/types';

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
    const input: unknown = JSON.parse(text);
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
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else {
        for (const line of formatVerification(result)) console.log(line);
        console.log('Next: review warnings and issuer trust before accepting this credential.');
    }
    if (verificationFailed(result)) process.exitCode = 1;
};
