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

        // Verify the wallet has a valid profile before attempting to send
        // Note: getProfile() swallows errors internally and may return undefined
        // instead of throwing, so we must check the return value explicitly.
        const profile = await wallet.invoke.getProfile();
        console.log('Profile check result:', profile ? `${profile.displayName || profile.profileId}` : 'null/undefined');
        if (!profile || !profile.profileId) {
            walletCache.delete(`${seed}:${networkUrl || 'default'}`);
            return res.status(401).json({
                error: 'Authentication failed — could not resolve a profile for this API token or seed. The SDK connected but no profile was found. This usually means the API token is invalid or the account does not exist on this network.',
                hint: 'Try clicking "Test LearnCard Init" first to verify your connection. Make sure you are using an API token (not a seed) from the developer portal.',
            });
        }
        console.log('Authenticated as:', profile.displayName || profile.profileId);

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

// POST /api/init - Initialize wallet and verify profile resolves
app.post('/api/init', async (req, res) => {
    const { seed, networkUrl } = req.body;
    if (!seed) return res.status(400).json({ error: 'API key or seed is required' });

    try {
        // Clear cache to force fresh init
        const cacheKey = `${seed}:${networkUrl || 'default'}`;
        walletCache.delete(cacheKey);

        const wallet = await getWallet(seed, networkUrl);

        let did = '';
        try { did = wallet.id.did(); } catch { /* API key mode — no local DID */ }

        // Actually verify the profile resolves (this is the real test)
        const profile = await wallet.invoke.getProfile();
        if (profile && profile.profileId) {
            console.log('Init verified — profile:', profile.profileId, 'displayName:', profile.displayName);
            res.json({
                success: true,
                did: profile.did || did || '(unknown)',
                profileId: profile.profileId,
                displayName: profile.displayName,
            });
        } else {
            console.warn('Init: wallet created but getProfile() returned:', profile);
            walletCache.delete(cacheKey);
            res.json({
                success: false,
                error: 'Wallet initialized but profile could not be resolved. The API token may not be associated with a valid account on this network.',
                did: did || '(none)',
                debug: {
                    isApiKey: seed.startsWith('eyJ'),
                    networkUrl: networkUrl || '(default/production)',
                    profileResult: profile === undefined ? 'undefined' : profile === null ? 'null' : 'empty object',
                },
            });
        }
    } catch (err) {
        console.error('Init failed:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n  ConsentFlow Test App running at http://localhost:${PORT}\n`);
});
