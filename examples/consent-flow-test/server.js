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

// Cache initialized wallets to avoid re-init on every request
const walletCache = new Map();

function isApiKey(key) {
    // API keys are JWTs (eyJ...), seeds are 64-char hex strings
    return key.startsWith('eyJ');
}

async function getWallet(key, networkUrl) {
    const cacheKey = `${key}:${networkUrl || 'default'}`;
    if (walletCache.has(cacheKey)) return walletCache.get(cacheKey);

    const network = networkUrl || true;

    let opts;
    if (isApiKey(key)) {
        console.log('Initializing LearnCard wallet with API key...');
        opts = { apiKey: key, network };
    } else {
        console.log('Initializing LearnCard wallet with seed...');
        opts = { seed: key, network };
    }

    const wallet = await initLearnCard(opts);

    // In API key mode, DID comes from the profile query (async).
    // Give it a moment to resolve, then fall back gracefully.
    let walletDid = '';
    try {
        walletDid = wallet.id.did();
    } catch {
        // API key mode: no local DID key, need to wait for profile
        await new Promise(r => setTimeout(r, 2000));
        try { walletDid = wallet.id.did(); } catch { /* still pending */ }
    }
    console.log('Wallet DID:', walletDid || '(resolving from profile...)');

    walletCache.set(cacheKey, wallet);
    return wallet;
}

// POST /api/send - Send a credential to a user
app.post('/api/send', async (req, res) => {
    const { seed, recipient, contractUri, templateUri, integrationId, networkUrl } = req.body;

    if (!seed) return res.status(400).json({ error: 'API key or seed is required' });
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
        let issuerDid = '';
        try { issuerDid = wallet.id.did(); } catch { /* API key mode */ }
        res.json({ success: true, result, issuerDid });
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
    if (!seed) return res.status(400).json({ error: 'API key or seed is required' });

    try {
        const wallet = await getWallet(seed, networkUrl);
        let did = '';
        try { did = wallet.id.did(); } catch { /* API key mode */ }
        res.json({ success: true, did: did || '(API key mode — DID resolved server-side)' });
    } catch (err) {
        console.error('Init failed:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n  ConsentFlow Test App running at http://localhost:${PORT}\n`);
});
