import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { methodSignaturesModule, readMethodSignatures } from './method-signatures';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const snippets = {
    SEND_MJS: 'quickstart/send.mjs',
    SEND_SH: 'quickstart/send.sh',
    SEND_FROM_TEMPLATE_MJS: 'quickstart/send-from-template.mjs',
    WEBHOOK_MJS: 'cli/webhook.mjs',
    CLAIM_BUTTON_HTML: 'cli/claim-button.html',
    CREATE_CONTRACT_MJS: 'consentflow/create-contract.mjs',
    CONSENT_CALLBACK_MJS: 'consentflow/consent-callback.mjs',
    READ_USER_DATA_MJS: 'consentflow/read-user-data.mjs',
    ISSUE_THROUGH_CONTRACT_MJS: 'consentflow/issue-through-contract.mjs',
    AGENT_SKILL_MD: 'agents/learncard-skill.md',
};
/** Deterministic and atomic: independent checkout users never read a partial module. */
export const embedSnippets = async (signal?: AbortSignal): Promise<void> => {
    signal?.throwIfAborted();
    const lines = await Promise.all(
        Object.entries(snippets).map(
            async ([name, file]) =>
                `export const ${name} = ${JSON.stringify(await readFile(resolve(root, 'docs/snippets', file), { encoding: 'utf8', signal }))};\n`
        )
    );
    await writeGenerated(
        resolve(root, 'packages/learn-card-cli/src/generated/snippets.ts'),
        '// Generated from docs/snippets. Do not edit.\n' + lines.join(''),
        signal
    );
    await writeGenerated(
        resolve(root, 'packages/learn-card-cli/src/generated/method-signatures.ts'),
        methodSignaturesModule(await readMethodSignatures(root)),
        signal
    );
};

/** Write a generated module only when it changed, atomically (temp file + rename). */
const writeGenerated = async (
    output: string,
    content: string,
    signal?: AbortSignal
): Promise<void> => {
    try {
        if ((await readFile(output, 'utf8')) === content) return;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    await mkdir(dirname(output), { recursive: true });
    const temporary = `${output}.${randomUUID()}.tmp`;
    try {
        await writeFile(temporary, content, { flag: 'wx', signal });
        signal?.throwIfAborted();
        await rename(temporary, output);
    } finally {
        await rm(temporary, { force: true });
    }
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await embedSnippets();
}
