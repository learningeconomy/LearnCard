import type { CredentialCandidate } from '../types/messages';
import { isVc } from '../utils/vc';
import type { Transformer, TransformerHelpers, TransformResult } from './types';

// JSON-LD pass-through transformer
const jsonldPassThrough: Transformer = {
  id: 'jsonld-pass-through',
  canTransform: (c) => c.source === 'jsonld' && !!c.raw && isVc(c.raw),
  transform: async (c) => ({ vcs: [c.raw as unknown] })
};

// Generic VC-API + fetch fallback transformer for link candidates
const vcapiOrFetch: Transformer = {
  id: 'vcapi-or-fetch',
  canTransform: (c) => typeof c.url === 'string' && /^https?:\/\//i.test(c.url),
  transform: async (c, helpers: TransformerHelpers): Promise<TransformResult | null> => {
    const url = c.url!;

    // Try VC-API handshake first
    try {
      const initJson = await helpers.postJson(url, {});
      const vpr = initJson?.verifiablePresentationRequest ?? initJson;
      const challenge = vpr?.challenge ?? vpr?.nonce;
      const domain = vpr?.domain;
      if (challenge) {
        const vp = await helpers.getDidAuthVp({ challenge, domain });
        const finalize = await helpers.postJson(url, { verifiablePresentation: vp });
        if (finalize && typeof finalize === 'object') {
          const result = finalize as any;
          if (result.ok === false) throw new Error(result.message || 'VC-API error');
          const vpOut = result?.verifiablePresentation ?? result?.vp ?? result;
          const vcsRaw = vpOut?.verifiableCredential ?? vpOut?.verifiableCredentials;
          const list: unknown[] = Array.isArray(vcsRaw) ? vcsRaw : vcsRaw ? [vcsRaw] : [];
          if (list.length) {
            const parsed = list.map((vc) => (typeof vc === 'string' ? JSON.parse(vc) : vc));
            return { vcs: parsed };
          }
        }
      }
    } catch {
      // ignore and try fetch fallback
    }

    // Fallback: GET JSON and check if it's a VC
    try {
      const data = await helpers.fetchJson(url);
      if (isVc(data)) return { vcs: [data] };
    } catch {
      // ignore
    }

    return null;
  }
};

const REGISTRY: Transformer[] = [jsonldPassThrough, vcapiOrFetch];

export const transformCandidate = async (
  candidate: CredentialCandidate,
  helpers: TransformerHelpers
): Promise<TransformResult | null> => {
  for (const t of REGISTRY) {
    try {
      if (t.canTransform(candidate)) {
        const res = await t.transform(candidate, helpers);
        if (res && Array.isArray(res.vcs) && res.vcs.length > 0) return res;
      }
    } catch {
      // try next transformer
    }
  }
  return null;
};
