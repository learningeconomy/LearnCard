import { createRequire } from 'module';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Use require() for @learncard/init because its ESM export has CJS interop issues
const require = createRequire(import.meta.url);
const { initLearnCard } = require('@learncard/init');

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 8899;

app.use(express.json());
app.use(express.static(__dirname));

// Cache initialized wallets by seed to avoid re-init on every request
const walletCache = new Map();

async function getWallet(seed, networkUrl) {
    const cacheKey = `${seed}:${networkUrl || 'default'}`;
    if (walletCache.has(cacheKey)) return walletCache.get(cacheKey);

    const opts = { seed, network: true };
    if (networkUrl) opts.networkLearnCardForDomain = networkUrl;

    console.log('Initializing LearnCard wallet...');
    const wallet = await initLearnCard(opts);
    console.log('Wallet DID:', wallet.id.did());
    walletCache.set(cacheKey, wallet);
    return wallet;
}

// POST /api/send - Send a credential to a user
app.post('/api/send', async (req, res) => {
    const { seed, recipient, contractUri, templateUri, integrationId, networkUrl } = req.body;

    if (!seed) return res.status(400).json({ error: 'seed is required (your issuer seed/API key)' });
    if (!recipient) return res.status(400).json({ error: 'recipient DID is required' });
    if (!contractUri) return res.status(400).json({ error: 'contractUri is required' });
    if (!templateUri) return res.status(400).json({ error: 'templateUri is required' });

    try {
        const wallet = await getWallet(seed, networkUrl);

        console.log('Sending credential...');
        console.log('  recipient:', recipient);
        console.log('  contractUri:', contractUri);
        console.log('  templateUri:', templateUri);
        console.log('  integrationId:', integrationId || '(none)');

        const sendArgs = {
            type: 'boost',
            recipient,
            contractUri,
            templateUri,
        };
        if (integrationId) sendArgs.integrationId = integrationId;

        const result = await wallet.invoke.send(sendArgs);

        console.log('Send result:', result);
        res.json({ success: true, result, issuerDid: wallet.id.did() });
    } catch (err) {
        console.error('Send failed:', err);
        res.status(500).json({
            error: err.message || 'Unknown error',
            details: err.shape?.message || err.cause?.message || undefined,
        });
    }
});

// POST /api/init - Just initialize and return the DID (for testing connection)
app.post('/api/init', async (req, res) => {
    const { seed, networkUrl } = req.body;
    if (!seed) return res.status(400).json({ error: 'seed is required' });

    try {
        const wallet = await getWallet(seed, networkUrl);
        res.json({ success: true, did: wallet.id.did() });
    } catch (err) {
        console.error('Init failed:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n  ConsentFlow Test App running at http://localhost:${PORT}\n`);
});
