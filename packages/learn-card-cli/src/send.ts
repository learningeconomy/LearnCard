import fs from 'fs/promises';
import path from 'path';
import { createInterface } from 'node:readline/promises';
import { randomUUID } from 'node:crypto';

import { initLearnCard } from '@learncard/init';

import { generateRandomSeed } from './random';

export type SendEnv = { SECURE_SEED?: string; PROFILE_ID?: string };

export const parseEnv = (text: string): Record<string, string> =>
    Object.fromEntries(
        text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#') && line.includes('='))
            .map(line => {
                const idx = line.indexOf('=');
                return [
                    line.slice(0, idx).trim(),
                    line
                        .slice(idx + 1)
                        .trim()
                        .replace(/^["']|["']$/g, ''),
                ];
            })
    );

export const upsertEnv = (text: string, values: Record<string, string>): string => {
    const lines = text ? text.replace(/\n$/, '').split('\n') : [];
    const seen = new Set<string>();
    const out = lines.map(line => {
        const key = line.split('=')[0]?.trim();
        if (key && key in values) {
            seen.add(key);
            return `${key}=${values[key]}`;
        }
        return line;
    });
    for (const [key, value] of Object.entries(values))
        if (!seen.has(key)) out.push(`${key}=${value}`);
    return `${out.join('\n')}\n`;
};

export const toProfileId = (displayName: string): string => {
    const base = displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 30);
    return `${base || 'issuer'}-${Math.random().toString(36).slice(2, 6)}`;
};

export const quickstartCredential = (issuerDid: string) => ({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: issuerDid,
    validFrom: new Date().toISOString(),
    name: 'Quickstart Complete',
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            name: 'Quickstart Complete',
            description: 'Sent a verifiable credential with LearnCard.',
            criteria: { narrative: 'Ran the LearnCard quickstart.' },
        },
    },
});

export const SEND_MJS = `import { randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

const recipientEmail = process.argv[2];
if (!recipientEmail) throw new Error('Usage: node --env-file=.env send.mjs you@example.com');

// \`network: true\` connects to the production LearnCard Network.
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });

// Your public identity on the network. Created once; safe to re-run.
if (!(await learnCard.invoke.getProfile())) {
    await learnCard.invoke.createProfile({
        profileId: process.env.PROFILE_ID,
        displayName: 'My Organization',
    });
}

// A minimal Open Badges 3.0 credential, signed by you.
const credential = await learnCard.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: learnCard.id.did(),
    validFrom: new Date().toISOString(),
    name: 'Quickstart Complete',
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            id: \`urn:uuid:\${randomUUID()}\`,
            type: ['Achievement'],
            name: 'Quickstart Complete',
            description: 'Sent a verifiable credential with LearnCard.',
            criteria: { narrative: 'Ran the LearnCard quickstart.' },
        },
    },
});

const result = await learnCard.invoke.sendCredentialViaInbox({
    recipient: { type: 'email', value: recipientEmail },
    credential,
});

if (result.status === 'PENDING') {
    console.log(
        \`Sent. \${recipientEmail} will get an email with this claim link:\\n\${result.claimUrl}\`
    );
} else {
    console.log(
        \`Delivered. \${recipientEmail} already uses LearnCard — the credential is in their wallet.\`
    );
}
`;

type SendOptions = { yes?: boolean; name?: string; network?: string; didkit?: Promise<Buffer> };

export const runSend = async (recipientEmail: string, options: SendOptions): Promise<void> => {
    const cwd = process.cwd();
    const envPath = path.join(cwd, '.env');
    const existing = await fs.readFile(envPath, 'utf8').catch(() => '');
    const env = parseEnv(existing);

    const rl = options.yes
        ? null
        : createInterface({ input: process.stdin, output: process.stdout });
    const ask = async (question: string, fallback: string) => {
        if (!rl) return fallback;
        const answer = (await rl.question(`${question} [${fallback}] `)).trim();
        return answer || fallback;
    };

    const displayName =
        options.name ?? (await ask('Display name for your issuer profile', 'My Organization'));
    const seed = env.SECURE_SEED || generateRandomSeed();
    const profileId =
        env.PROFILE_ID ||
        (await ask('Profile ID (public handle, 3–40 chars)', toProfileId(displayName)));
    rl?.close();

    const updates: Record<string, string> = {};
    if (!env.SECURE_SEED) updates.SECURE_SEED = seed;
    if (!env.PROFILE_ID) updates.PROFILE_ID = profileId;
    if (Object.keys(updates).length) {
        await fs.writeFile(envPath, upsertEnv(existing, updates));
        console.log(`Wrote ${Object.keys(updates).join(' and ')} to .env`);
    }
    const gitignorePath = path.join(cwd, '.gitignore');
    const gitignore = await fs.readFile(gitignorePath, 'utf8').catch(() => null);
    if (gitignore !== null && !gitignore.split('\n').some(l => l.trim() === '.env')) {
        await fs.writeFile(gitignorePath, `${gitignore.replace(/\n?$/, '\n')}.env\n`);
        console.log('Added .env to .gitignore');
    }

    console.log('Connecting to the LearnCard Network...');
    const learnCard = await initLearnCard({
        seed,
        network: options.network ?? true,
        ...(options.didkit && { didkit: options.didkit }),
    });

    if (!(await learnCard.invoke.getProfile())) {
        await learnCard.invoke.createProfile({ profileId, displayName, bio: '', shortBio: '' });
        console.log(`Created profile "${displayName}" (${profileId})`);
    }

    const credential = await learnCard.invoke.issueCredential(
        quickstartCredential(learnCard.id.did())
    );
    const result = await learnCard.invoke.sendCredentialViaInbox({
        recipient: { type: 'email', value: recipientEmail },
        credential,
    });

    console.log('');
    if (result.status === 'PENDING') {
        console.log(
            `Sent. ${recipientEmail} will get an email with this claim link:\n${result.claimUrl}`
        );
    } else {
        console.log(
            `Delivered. ${recipientEmail} already uses LearnCard — the credential is in their wallet.`
        );
    }

    const sendPath = path.join(cwd, 'send.mjs');
    if (!(await fs.stat(sendPath).catch(() => null))) {
        await fs.writeFile(
            sendPath,
            SEND_MJS.replace(
                "displayName: 'My Organization'",
                `displayName: ${JSON.stringify(displayName)}`
            )
        );
        console.log(
            `\nThe code that just ran is in ./send.mjs — run it yourself:\n  npm install @learncard/init\n  node --env-file=.env send.mjs ${recipientEmail}`
        );
    }
};
