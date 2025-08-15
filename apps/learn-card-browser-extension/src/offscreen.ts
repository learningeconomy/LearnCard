// Offscreen document script for LearnCard initialization and storage
import { initLearnCard } from '@learncard/init';
import didkitWasmUrl from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';
import type { CredentialCandidate, CredentialCategory } from './types/messages';
import { computeCredentialHash } from './utils/hash';

type LearnCardLike = {
  id: { did: () => string; keypair: (type: string) => { d: string } };
  store: {
    uploadEncrypted: (vc: unknown) => Promise<unknown>;
    LearnCloud?: { uploadEncrypted: (vc: unknown) => Promise<string | unknown> };
  };
  index?: {
    LearnCloud?: {
      add: (args: { id?: string; uri: string; category: string }) => Promise<unknown>;
      getCount: (query?: Record<string, any>) => Promise<number>;
    };
  };
  invoke: {
    getDidAuthVp: (args: { challenge: string; domain?: string }) => Promise<unknown>;
    hash?: (message: string, algorithm?: string) => Promise<string | undefined>;
    crypto: () => Crypto;
    getProfile?: () => Promise<any>;
  };
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

async function getProfile(seed: string): Promise<any | undefined> {
  const lc = await ensureLearnCard(seed);
  try {
    const prof = await (lc as any)?.invoke?.getProfile?.();
    if (!prof) return undefined;
    return prof;
  } catch {
    // ignore
  }
  return undefined;
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

async function checkClaimedForVc(lc: LearnCardLike, vc: unknown): Promise<boolean> {
  try {
    const canonicalId = await computeCredentialHash(lc as any, vc);
    const count = await lc.index?.LearnCloud?.getCount?.({ id: canonicalId });
    return Boolean(count && count > 0);
  } catch {
    return false;
  }
}

async function handleCheckClaimed(
  candidate: CredentialCandidate,
  seed: string | undefined
): Promise<boolean> {
  const lc = await ensureLearnCard(seed);

  if (candidate.source === 'jsonld' && candidate.raw) {
    const raw = candidate.raw as any;
    const vc = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return checkClaimedForVc(lc, vc);
  }

  if (candidate.url) {
    const url = candidate.url;
    try {
      const resp = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } });
      if (!resp.ok) throw new Error('Fetch failed');
      const data = await resp.json();
      if (looksLikeVc(data)) return checkClaimedForVc(lc, data);
    } catch {
      // Best-effort only; if we can't fetch/parse, treat as not claimed
    }
  }

  return false;
}

async function handleStoreCandidate(
  candidate: CredentialCandidate,
  seed: string | undefined,
  category: CredentialCategory = 'Achievement'
): Promise<number> {
  const lc = await ensureLearnCard(seed);

  // JSON-LD payload directly provided
  if (candidate.source === 'jsonld' && candidate.raw) {
    const raw = candidate.raw as any;
    const vc = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const uri = await lc.store?.LearnCloud?.uploadEncrypted(vc);
    const uriStr = typeof uri === 'string' ? uri : String(uri);
    try {
      const canonicalId = await computeCredentialHash(lc as any, vc);
      await lc.index?.LearnCloud?.add({ id: canonicalId, uri: uriStr, category });
    } catch {
      // Fall back to no-id add if hashing fails for any reason
      await lc.index?.LearnCloud?.add({ uri: uriStr, category });
    }
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
            try {
              const canonicalId = await computeCredentialHash(lc as any, parsed);
              await lc.index?.LearnCloud?.add({ id: canonicalId, uri: uriStr, category });
            } catch {
              await lc.index?.LearnCloud?.add({ uri: uriStr, category });
            }
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
        try {
          const canonicalId = await computeCredentialHash(lc as any, data);
          await lc.index?.LearnCloud?.add({ id: canonicalId, uri: uriStr, category });
        } catch {
          await lc.index?.LearnCloud?.add({ uri: uriStr, category });
        }
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
    if (message?.type === 'vcapi-open') {
      const seed = message?.data?.seed as string | undefined;
      const url = message?.data?.url as string | undefined;
      if (!seed || !url) {
        sendResponse({ ok: false, error: 'Missing seed or url' });
        return false;
      }
      (async () => {
        try {
          const lc = await ensureLearnCard(seed);
          // Initiate VC-API flow
          const initResp = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({})
          });
          if (!initResp.ok) {
            const text = await initResp.text().catch(() => '');
            throw new Error(`VC-API init failed: ${initResp.status} ${text}`);
          }
          const initJson = await initResp.json().catch(() => ({}));
          const challenge = initJson.challenge ?? initJson.nonce;
          const domain = initJson.domain;
          if (!challenge) throw new Error('Missing VC-API challenge');
          const vp = await lc.invoke.getDidAuthVp({ challenge, domain });
          const finalize = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ verifiablePresentation: vp })
          });
          if (!finalize.ok) {
            const text = await finalize.text().catch(() => '');
            throw new Error(`VC-API finalize failed: ${finalize.status} ${text}`);
          }
          const result = await finalize.json().catch(() => ({}));
          const vpOut = (result?.verifiablePresentation ?? result?.vp ?? result) as any;
          const vcsRaw = vpOut?.verifiableCredential ?? vpOut?.verifiableCredentials;
          const rawList: unknown[] = Array.isArray(vcsRaw) ? vcsRaw : vcsRaw ? [vcsRaw] : [];
          const vcs: any[] = rawList.map((vc) => (typeof vc === 'string' ? JSON.parse(vc) : vc));
          sendResponse({ ok: true, vcs });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          sendResponse({ ok: false, error: msg });
        }
      })();
      return true;
    }

    if (message?.type === 'vcapi-accept') {
      const items = (message?.data?.items as { vc: unknown; category?: CredentialCategory }[] | undefined) ?? [];
      const seed = message?.data?.seed as string | undefined;
      if (!Array.isArray(items) || items.length === 0) {
        sendResponse({ ok: false, error: 'Missing items' });
        return false;
      }
      (async () => {
        try {
          const lc = await ensureLearnCard(seed);
          let saved = 0;
          for (const { vc, category } of items) {
            try {
              const uri = await lc.store?.LearnCloud?.uploadEncrypted(vc);
              const uriStr = typeof uri === 'string' ? uri : String(uri);
              try {
                const canonicalId = await computeCredentialHash(lc as any, vc);
                await lc.index?.LearnCloud?.add({ id: canonicalId, uri: uriStr, category: (category as CredentialCategory) ?? 'Achievement' });
              } catch {
                await lc.index?.LearnCloud?.add({ uri: uriStr, category: (category as CredentialCategory) ?? 'Achievement' });
              }
              saved += 1;
            } catch {
              // continue
            }
          }
          sendResponse({ ok: true, savedCount: saved });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          sendResponse({ ok: false, error: msg });
        }
      })();
      return true;
    }
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
      const category = message?.data?.category as CredentialCategory | undefined;
      if (!candidate) {
        sendResponse({ ok: false, error: 'Missing credential candidate' });
        return false;
      }
      handleStoreCandidate(candidate, seed, category ?? 'Achievement')
        .then((savedCount) => sendResponse({ ok: true, savedCount }))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          sendResponse({ ok: false, error: msg });
        });
      return true;
    }

    if (message?.type === 'get-profile') {
      const seed = message?.data?.seed as string | undefined;
      if (!seed) {
        sendResponse({ ok: false, error: 'Missing seed' });
        return false;
      }
      getProfile(seed)
        .then((profile) => sendResponse({ ok: true, profile }))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          sendResponse({ ok: false, error: msg });
        });
      return true;
    }

    if (message?.type === 'store-credentials') {
      const items = (message?.data?.items as { candidate: CredentialCandidate; category?: CredentialCategory }[] | undefined) ?? [];
      const seed = message?.data?.seed as string | undefined;
      if (!Array.isArray(items) || items.length === 0) {
        sendResponse({ ok: false, error: 'Missing selections' });
        return false;
      }
      (async () => {
        try {
          let saved = 0;
          for (const it of items) {
            try {
              saved += await handleStoreCandidate(it.candidate, seed, (it.category as CredentialCategory) ?? 'Achievement');
            } catch (e) {
              // continue with next
            }
          }
          sendResponse({ ok: true, savedCount: saved });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          sendResponse({ ok: false, error: msg });
        }
      })();
      return true;
    }

    if (message?.type === 'check-claimed') {
      const candidate = message?.data?.candidate as CredentialCandidate | undefined;
      const seed = message?.data?.seed as string | undefined;
      if (!candidate) {
        sendResponse({ ok: false, error: 'Missing credential candidate' });
        return false;
      }
      handleCheckClaimed(candidate, seed)
        .then((claimed) => sendResponse({ ok: true, claimed }))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          sendResponse({ ok: false, error: msg });
        });
      return true;
    }

    if (message?.type === 'check-claimed-many') {
      const items = (message?.data?.candidates as CredentialCandidate[] | undefined) ?? [];
      const seed = message?.data?.seed as string | undefined;
      if (!Array.isArray(items) || items.length === 0) {
        sendResponse({ ok: false, error: 'Missing candidates' });
        return false;
      }
      (async () => {
        try {
          const results: boolean[] = [];
          for (const it of items) {
            try {
              results.push(await handleCheckClaimed(it, seed));
            } catch {
              results.push(false);
            }
          }
          sendResponse({ ok: true, results });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          sendResponse({ ok: false, error: msg });
        }
      })();
      return true;
    }
  }

  return false;
});
