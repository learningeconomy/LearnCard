import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { initLearnCard } from '@learncard/init';

// Decoding is not verification: inspect claims only after verifying the signature.
export const verifyConsentRedirect = async (learnCard, vp, contractUri) => {
    if (!vp) return { status: 'denied-or-abandoned' };
    if (typeof vp !== 'string' || vp.split('.').length !== 3 || !contractUri) {
        throw new Error('Invalid consent proof');
    }
    const result = await learnCard.invoke.verifyPresentation(vp, { proofFormat: 'jwt' });
    if (result.errors.length !== 0) throw new Error('Invalid consent proof');

    const payload = JSON.parse(Buffer.from(vp.split('.')[1], 'base64url').toString('utf8'));
    const userDid = payload.vp?.holder;
    if (typeof userDid !== 'string' || !userDid.startsWith('did:') || payload.iss !== userDid) {
        throw new Error('Invalid consent holder');
    }
    if (payload.vp.contractUri !== contractUri) throw new Error('Wrong consent contract');
    return { status: 'verified', userDid };
};

export const createConsentCallback = (learnCard, contractUri) => async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const url = new URL(req.url, 'http://localhost');
    if (req.method !== 'GET' || url.pathname !== '/consent-callback') {
        res.writeHead(404).end('Not found');
        return;
    }
    try {
        const verified = await verifyConsentRedirect(
            learnCard,
            url.searchParams.get('vp'),
            contractUri
        );
        // The convenience `did` parameter is deliberately never read.
        if (verified.status !== 'verified') {
            res.writeHead(400).end('Consent denied or abandoned. Try again.');
            return;
        }
        const { readUserData } = await import('./read-user-data.mjs');
        const records = await readUserData(learnCard, verified.userDid, contractUri);
        if (records.length === 0) {
            res.writeHead(403).end('No active consent.');
            return;
        }
        // Do not expose personal data, create a login session, or issue on this GET.
        res.end('Consent verified. Active access confirmed.');
    } catch {
        res.writeHead(400).end('Unable to confirm consent. Try again.');
    }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { SECURE_SEED, CONTRACT_URI } = process.env;
    if (!SECURE_SEED || !CONTRACT_URI) throw new Error('Set SECURE_SEED and CONTRACT_URI');
    const learnCard = await initLearnCard({ seed: SECURE_SEED, network: true });
    createServer(createConsentCallback(learnCard, CONTRACT_URI)).listen(3000, '127.0.0.1');
    console.log('Callback listening on port 3000.');
}
