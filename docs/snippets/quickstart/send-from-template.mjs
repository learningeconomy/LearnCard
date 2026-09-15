import { initLearnCard } from '@learncard/init';

const recipient = process.argv[2];
if (!recipient)
    throw new Error('Usage: node --env-file=.env send-from-template.mjs you@example.com');
if (!process.env.TEMPLATE_URI)
    throw new Error('Run npx @learncard/cli send you@example.com --template first.');

// The CLI saved a template and registered your primary signing authority once.
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient,
    templateUri: process.env.TEMPLATE_URI,
});
console.log(
    result.inbox?.status === 'PENDING'
        ? `Sent. ${recipient} will get a claim email. You can also share this link directly:\n${result.inbox.claimUrl}`
        : `Delivered. ${recipient} already uses LearnCard — the credential is in their wallet.`
);
console.log(`Reusable template for this badge: ${result.uri}`);
