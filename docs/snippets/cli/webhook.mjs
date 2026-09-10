import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export const extractBearer = header =>
    typeof header === 'string' ? /^Bearer\s+(\S+)$/i.exec(header)?.[1] : undefined;

export const webhookDedupeKey = payload => {
    const id = payload?.data?.inbox?.issuanceId;
    return ['ISSUANCE_DELIVERED', 'ISSUANCE_CLAIMED', 'ISSUANCE_ERROR'].includes(payload?.type) &&
        typeof id === 'string' && id.length > 0
        ? `${payload.type}:${id}`
        : undefined;
};

export const createWebhookReceiver = (verifier, expectedDid = process.env.EXPECTED_NETWORK_DID) => {
    // Demo only: bounded, in-memory deduplication. Use durable storage in production.
    const seen = new Set();
    return createServer(async (req, res) => {
        if (req.method !== 'POST') return void res.writeHead(404).end();
        const token = extractBearer(req.headers.authorization);
        try {
            if (!token) return void res.writeHead(401).end();
            const result = await verifier.invoke.verifyPresentation(token, { proofFormat: 'jwt' });
            if (result.errors.length) return void res.writeHead(401).end();
            const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
            if (expectedDid && claims.iss !== expectedDid) return void res.writeHead(403).end();
        } catch {
            return void res.writeHead(401).end();
        }
        try {
            const chunks = [];
            let size = 0;
            for await (const chunk of req) {
                size += chunk.length;
                if (size > 65536) return void res.writeHead(413).end();
                chunks.push(chunk);
            }
            const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            const key = webhookDedupeKey(payload);
            if (!key) return void res.writeHead(400).end();
            // Acknowledge before doing any application work; LearnCard waits six seconds.
            res.writeHead(200).end();
            if (seen.has(key)) return;
            if (seen.size >= 10000) seen.delete(seen.values().next().value);
            seen.add(key);
            const inbox = payload.data.inbox;
            const fields = [payload.type, inbox.status, inbox.issuanceId, inbox.recipient?.learnCardId];
            console.log(fields.map(value => typeof value === 'string'
                ? value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, '?') : '').join(' ').trim());
        } catch {
            if (!res.headersSent) res.writeHead(400).end();
        }
    });
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { initLearnCard } = await import('@learncard/init');
    const port = Number(process.env.PORT || 8787);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1–65535');
    const verifier = await initLearnCard();
    if (!process.env.EXPECTED_NETWORK_DID) {
        console.log('Demo: signatures are verified, but any DID is accepted. Set EXPECTED_NETWORK_DID to your trusted network DID before production.');
    }
    const server = createWebhookReceiver(verifier);
    server.requestTimeout = 5000;
    server.listen(port, () => console.log(`Listening on http://localhost:${port}`));
}
