import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
};
const lines = await Promise.all(
    Object.entries(snippets).map(
        async ([name, file]) =>
            `export const ${name} = ${JSON.stringify(await readFile(resolve(root, 'docs/snippets', file), 'utf8'))};\n`
    )
);
const output = resolve(root, 'packages/learn-card-cli/src/generated/snippets.ts');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, '// Generated from docs/snippets. Do not edit.\n' + lines.join(''));
