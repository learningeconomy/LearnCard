import { initLearnCard } from '@learncard/init';

const activityId = process.argv[2];
if (!activityId) throw new Error('Usage: node --env-file=.env status.mjs <activityId>');

const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });

const chain = await learnCard.invoke.getActivityChain({ activityId });
const latest = chain.at(-1);

for (const event of chain) console.log(`${event.timestamp}  ${event.eventType}`);
console.log(latest?.eventType === 'CLAIMED' ? 'Claimed.' : 'Not claimed yet.');
