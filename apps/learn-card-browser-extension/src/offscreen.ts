// Offscreen document script for LearnCard initialization and storage
import { initLearnCard } from '@learncard/init';
import didkitWasmUrl from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';
import type { CredentialCandidate } from './types/messages';

type LearnCardLike = {
  id: { did: () => string };
  store: {
    uploadEncrypted: (vc: unknown) => Promise<unknown>;
    LearnCloud?: { uploadEncrypted: (vc: unknown) => Promise<string | unknown> };
  };
  index?: { LearnCloud?: { add: (args: { uri: string; category: string }) => Promise<unknown> } };
  invoke: { getDidAuthVp: (args: { challenge: string; domain?: string }) => Promise<unknown> };
};

let learnCard: LearnCardLike | null = null;

async function ensureLearnCard(seed?: string): Promise<LearnCardLike> {
  if (learnCard) return learnCard;
  const useSeed = seed;
  if (!useSeed) throw new Error('Not logged in');

  const instance = await initLearnCard({
    seed: useSeed,
    network: true,
    didkit: didkitWasmUrl
  });
  // Narrow to methods we use
  learnCard = instance as unknown as LearnCardLike;
  return learnCard;
}

async function initializeAndGetDid(seed: string): Promise<string | undefined> {
  const lc = await ensureLearnCard(seed);
  return lc?.id.did();
}

function isObject(x: unknown): x is Record<string, any> {
  return !!x && typeof x === 'object';
}

function looksLikeVc(obj: any): boolean {
  return (
    isObject(obj) &&
    (Array.isArray(obj['@context']) || typeof obj['@context'] === 'string') &&
    (Array.isArray(obj.type) || typeof obj.type === 'string' || Array.isArray(obj['type']))
  );
}

async function handleStoreCandidate(candidate: CredentialCandidate, seed?: string): Promise<number> {
  const lc = await ensureLearnCard(seed);

  // JSON-LD payload directly provided
  if (candidate.source === 'jsonld' && candidate.raw) {
    const raw = candidate.raw as any;
    const vc = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const uri = await lc.store?.LearnCloud?.uploadEncrypted(vc);
    const uriStr = typeof uri === 'string' ? uri : String(uri);
    await lc.index?.LearnCloud?.add({ uri: uriStr, category: 'Achievement' });
    return 1;
  }

  // Link based - attempt VC-API handshake first, then fall back to fetching VC JSON
  if (candidate.url) {
    const url = candidate.url;

    // Try VC-API flow
    try {
      const initResp = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({})
      });

      if (initResp.ok) {
        const initJson = await initResp.json().catch(() => ({}));
        const challenge = initJson.challenge ?? initJson.nonce;
        const domain = initJson.domain;
        if (challenge) {
          const vp = await lc.invoke.getDidAuthVp({ challenge, domain });
          const finalize = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ verifiablePresentation: vp })
          });

          if (!finalize.ok) {
            const text = await finalize.text();
            throw new Error(`VC-API finalize failed: ${finalize.status} ${text}`);
          }

          const result = await finalize.json().catch(() => ({}));
          const vpOut = result?.verifiablePresentation ?? result?.vp ?? result;
          const vcsRaw = vpOut?.verifiableCredential ?? vpOut?.verifiableCredentials;
          const vcs: any[] = Array.isArray(vcsRaw) ? vcsRaw : vcsRaw ? [vcsRaw] : [];
          let saved = 0;
          for (const vc of vcs) {
            const parsed = typeof vc === 'string' ? JSON.parse(vc) : vc;
            const uri = await lc.store?.LearnCloud?.uploadEncrypted(vc);
            const uriStr = typeof uri === 'string' ? uri : String(uri);
            await lc.index?.LearnCloud?.add({ uri: uriStr, category: 'Achievement' });
            saved += 1;
          }
          if (saved > 0) return saved;
          // If no VC returned, fall through to GET as a fallback
        }
      }
    } catch (e) {
      // swallow and try GET fallback below
    }

    // Fallback: try fetching a JSON VC directly
    try {
      const resp = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } });
      if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
      const data = await resp.json();
      if (looksLikeVc(data)) {
        const uri = await lc.store?.LearnCloud?.uploadEncrypted(data);
        const uriStr = typeof uri === 'string' ? uri : String(uri);
        await lc.index?.LearnCloud?.add({ uri: uriStr, category: 'Achievement' });
        return 1;
      }
    } catch (e) {
      // final failure will be thrown below
    }
  }

  throw new Error('Unsupported credential source or failed to retrieve credential');
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target === 'offscreen') {
    if (message?.type === 'start-learncard-init') {
      const seed = message?.data?.seed as string | undefined;
      if (!seed) {
        sendResponse({ ok: false, error: 'Missing seed' });
        return false;
      }
      initializeAndGetDid(seed)
        .then((did) => sendResponse({ ok: true, did }))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          sendResponse({ ok: false, error: msg });
        });
      return true;
    }

    if (message?.type === 'store-credential') {
      const candidate = message?.data?.candidate as CredentialCandidate | undefined;
      const seed = message?.data?.seed as string | undefined;
      if (!candidate) {
        sendResponse({ ok: false, error: 'Missing credential candidate' });
        return false;
      }
      handleStoreCandidate(candidate, seed)
        .then((savedCount) => sendResponse({ ok: true, savedCount }))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          sendResponse({ ok: false, error: msg });
        });
      return true;
    }
  }

  return false;
});
