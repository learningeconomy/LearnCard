import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { initLearnCard } from '@learncard/init';
import { getDidKitPlugin } from '@learncard/didkit-plugin';
import { getDidKeyPlugin } from '@learncard/didkey-plugin';

const seed = process.env.SECURE_SEED ?? randomBytes(32).toString('hex');
const require = createRequire(import.meta.url);
const didkit = readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);
const baseLearnCard = await initLearnCard({ custom: true });
const didkitLearnCard = await baseLearnCard.addPlugin(await getDidKitPlugin(didkit));
const learnCard = await didkitLearnCard.addPlugin(
    await getDidKeyPlugin(didkitLearnCard, seed, 'key')
);
console.log(learnCard.id.did());
