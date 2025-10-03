import type {
  CredentialCandidate,
  ExtensionMessage,
  GetDetectedMessage,
  SaveCredentialMessage,
  CredentialsDetectedMessage,
  CredentialCategory,
  VcApiExchangeState,
} from '../types/messages';

// Track detections per tab so we can show per-tab badge counts
const detectedByTab: Record<number, CredentialCandidate[]> = {};

// Track VC-API exchange session state per tab
const vcapiByTab: Record<
  number,
  { state: VcApiExchangeState; url?: string; offers?: any[]; error?: string | null }
> = {};

// Offscreen helper to initialize LearnCard in a document context
const runInitInOffscreen = async (seed: string): Promise<string | undefined> => {
  // Ensure an offscreen document exists (best-effort)
  try {
    await chrome.offscreen.createDocument({
      url: 'src/offscreen.html',
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Initialize DIDKit (WASM) in a document context.'
    });
  } catch {
    // If it already exists, ignore
  }

  // Send message to offscreen page and await result
  const result = await chrome.runtime.sendMessage({
    type: 'start-learncard-init',
    target: 'offscreen',
    data: { seed }
  });

  // Best-effort close to save resources
  try {
    chrome.offscreen?.closeDocument?.();
  } catch {
    // ignore
  }

  if (result?.ok) return result.did as string | undefined;
  throw new Error(result?.error ?? 'Offscreen init failed');
};


// Removed direct LearnCard initialization in service worker.

// Offscreen helper to get profile image via LearnCard
const runGetProfileInOffscreen = async (): Promise<object | undefined> => {
  try {
    await chrome.offscreen.createDocument({
      url: 'src/offscreen.html',
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Fetch profile via LearnCard in a document context.'
    });
  } catch {}

  const { authSeed = null } = await storageGet<{ authSeed: string | null }>({ authSeed: null });
  if (!authSeed) throw new Error('Not logged in');

  const result = await chrome.runtime.sendMessage({
    type: 'get-profile',
    target: 'offscreen',
    data: { seed: authSeed }
  });

  try {
    chrome.offscreen?.closeDocument?.();
  } catch {}

  if (result?.ok) return (result.profile as object | undefined) ?? undefined;
  throw new Error(result?.error ?? 'Offscreen get-profile failed');
};

// Offscreen helper to store a detected credential using LearnCard
const runStoreInOffscreen = async (
  candidate: CredentialCandidate,
  category?: CredentialCategory
): Promise<{ savedCount: number }> => {
  // Ensure an offscreen document exists (best-effort)
  try {
    await chrome.offscreen.createDocument({
      url: 'src/offscreen.html',
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Store credentials using LearnCard in a document context.'
    });
  } catch {
    // ignore if already exists
  }

  // Retrieve seed from storage and forward to offscreen to avoid chrome.storage in offscreen
  const { authSeed = null } = await storageGet<{ authSeed: string | null }>({ authSeed: null });
  if (!authSeed) throw new Error('Not logged in');

  const result = await chrome.runtime.sendMessage({
    type: 'store-credential',
    target: 'offscreen',
    data: { candidate, seed: authSeed, category }
  });

  try {
    chrome.offscreen?.closeDocument?.();
  } catch {
    // ignore
  }

  if (result?.ok) return { savedCount: Number(result.savedCount ?? 0) };
  throw new Error(result?.error ?? 'Offscreen store failed');
};

// Offscreen helper to check claimed status for many candidates
const runCheckClaimedManyInOffscreen = async (
  candidates: CredentialCandidate[]
): Promise<boolean[]> => {
  try {
    await chrome.offscreen.createDocument({
      url: 'src/offscreen.html',
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Query LearnCloud index for claimed status in a document context.'
    });
  } catch {}

  const { authSeed = null } = await storageGet<{ authSeed: string | null }>({ authSeed: null });
  if (!authSeed) throw new Error('Not logged in');

  const result = await chrome.runtime.sendMessage({
    type: 'check-claimed-many',
    target: 'offscreen',
    data: { candidates, seed: authSeed }
  });

  try {
    chrome.offscreen?.closeDocument?.();
  } catch {}

  if (result?.ok && Array.isArray(result.results)) return result.results as boolean[];
  throw new Error(result?.error ?? 'Offscreen claimed check failed');
};

// Offscreen helper to store many credentials in one shot
const runStoreManyInOffscreen = async (
  items: { candidate: CredentialCandidate; category?: CredentialCategory }[]
): Promise<{ savedCount: number }> => {
  try {
    await chrome.offscreen.createDocument({
      url: 'src/offscreen.html',
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Store credentials using LearnCard in a document context.'
    });
  } catch {}

  const { authSeed = null } = await storageGet<{ authSeed: string | null }>({ authSeed: null });
  if (!authSeed) throw new Error('Not logged in');

  const result = await chrome.runtime.sendMessage({
    type: 'store-credentials',
    target: 'offscreen',
    data: { items, seed: authSeed }
  });

  try {
    chrome.offscreen?.closeDocument?.();
  } catch {}

  if (result?.ok) return { savedCount: Number(result.savedCount ?? 0) };
  throw new Error(result?.error ?? 'Offscreen bulk store failed');
};

// Offscreen helper to open a VC-API offer and fetch VCs without storing
const runVcApiOpenInOffscreen = async (url: string): Promise<{ vcs: any[] }> => {
  try {
    await chrome.offscreen.createDocument({
      url: 'src/offscreen.html',
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Perform VC-API handshake and fetch offers in a document context.'
    });
  } catch {}

  const { authSeed = null } = await storageGet<{ authSeed: string | null }>({ authSeed: null });
  if (!authSeed) throw new Error('Not logged in');

  const result = await chrome.runtime.sendMessage({
    type: 'vcapi-open',
    target: 'offscreen',
    data: { seed: authSeed, url }
  });

  try {
    chrome.offscreen?.closeDocument?.();
  } catch {}

  if (result?.ok) return { vcs: (Array.isArray(result.vcs) ? result.vcs : []) as any[] };
  throw new Error(result?.error ?? 'Offscreen VC-API open failed');
};

// Offscreen helper to accept selected VC-API offers and store them
const runVcApiAcceptInOffscreen = async (
  items: { vc: unknown; category?: CredentialCategory }[]
): Promise<{ savedCount: number }> => {
  try {
    await chrome.offscreen.createDocument({
      url: 'src/offscreen.html',
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Store VC-API credentials using LearnCard in a document context.'
    });
  } catch {}

  const { authSeed = null } = await storageGet<{ authSeed: string | null }>({ authSeed: null });
  if (!authSeed) throw new Error('Not logged in');

  const result = await chrome.runtime.sendMessage({
    type: 'vcapi-accept',
    target: 'offscreen',
    data: { items, seed: authSeed }
  });

  try {
    chrome.offscreen?.closeDocument?.();
  } catch {}

  if (result?.ok) return { savedCount: Number(result.savedCount ?? 0) };
  throw new Error(result?.error ?? 'Offscreen VC-API accept failed');
};

const parseParams = (url: string): Record<string, string> => {
  try {
    const u = new URL(url);
    const out: Record<string, string> = {};
    u.searchParams.forEach((v, k) => (out[k] = v));
    if (u.hash && u.hash.length > 1) {
      const hash = u.hash.startsWith('#') ? u.hash.slice(1) : u.hash;
      new URLSearchParams(hash).forEach((v, k) => (out[k] = v));
    }
    return out;
  } catch {
    return {};
  }
};

const dedupeCandidates = (list: CredentialCandidate[]): CredentialCandidate[] => {
  const map = new Map<string, CredentialCandidate>();
  const keyFor = (c: CredentialCandidate) => {
    if (c.url) return `url:${c.url}`;
    try {
      return `raw:${JSON.stringify(c.raw)}`;
    } catch {
      return `raw:${String(c.title ?? '')}`;
    }
  };
  for (const c of list) {
    const k = keyFor(c);
    if (!map.has(k)) map.set(k, c);
  }
  return Array.from(map.values());
};

const storageGet = <T = unknown>(defaults: Record<string, unknown>): Promise<T> =>
  new Promise((resolve) => {
    chrome.storage.local.get(defaults, (items) => resolve(items as unknown as T));
  });

const storageSet = (items: Record<string, unknown>): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.set(items, () => resolve());
  });

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});

chrome.runtime.onStartup.addListener(() => {
  (async () => {
    try {
      const { authSeed = null, authDid = null } = await storageGet<{
        authSeed: string | null;
        authDid: string | null;
      }>({ authSeed: null, authDid: null });
      // if (authSeed) {
      //   const lc = await ensureLearnCard(authSeed);
      //   const did = lc.id.did();
      //   if (!authDid) await storageSet({ authDid: did });
      // }
    } catch (err) {
      // non-fatal
      console.warn('Failed to init LearnCard on startup', err);
    }
  })();
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  switch (message.type) {
    case 'credential-detected': {
      const tabId = _sender.tab?.id;
      if (typeof tabId === 'number') {
        detectedByTab[tabId] = [message.payload];
        chrome.action.setBadgeText({ text: '1', tabId });
      } else {
        // Fallback if no tabId
        detectedByTab[-1] = [message.payload];
        chrome.action.setBadgeText({ text: '1' });
      }
      sendResponse({ ok: true });
      return; // synchronous
    }
    case 'credentials-detected': {
      const msg = message as CredentialsDetectedMessage;
      const tabId = (typeof msg.tabId === 'number' ? msg.tabId : _sender.tab?.id) ?? -1;
      const list = msg.payload ?? [];
      const shouldMerge = typeof msg.tabId === 'number'; // Merge when explicitly sent from popup
      const existing = detectedByTab[tabId] ?? [];
      const next = shouldMerge ? dedupeCandidates([...existing, ...list]) : list;
      detectedByTab[tabId] = next;
      if (typeof tabId === 'number') {
        chrome.action.setBadgeText({ text: next.length ? String(next.length) : '', tabId });
      } else {
        chrome.action.setBadgeText({ text: next.length ? String(next.length) : '' });
      }
      sendResponse({ ok: true });
      return; // synchronous
    }
    case 'get-detected': {
      (async () => {
        try {
          const msg = message as GetDetectedMessage;
          const tabId = (typeof msg.tabId === 'number' ? msg.tabId : _sender.tab?.id) ?? -1;
          const data = detectedByTab[tabId] ?? [];
          if (data.length === 0) {
            sendResponse({ ok: true, data });
            return;
          }
          let results: boolean[] = [];
          try {
            results = await runCheckClaimedManyInOffscreen(data);
          } catch {
            // not logged in or failed; return as-is
            sendResponse({ ok: true, data });
            return;
          }
          const enriched = data.map((c, i) => ({ ...c, claimed: !!results[i] }));
          detectedByTab[tabId] = enriched;
          sendResponse({ ok: true, data: enriched });
        } catch (err) {
          sendResponse({ ok: false, error: (err as Error).message });
        }
      })();
      return true;
    }
    case 'save-credential': {
      (async () => {
        try {
          const msg = message as SaveCredentialMessage;
          const tabId = (typeof msg.tabId === 'number' ? msg.tabId : _sender.tab?.id) ?? -1;
          const toSave = (detectedByTab[tabId] ?? [])[0] ?? null;
          if (!toSave) {
            sendResponse({ ok: false, error: 'No credential to save' });
            return;
          }

          // Block saving if already claimed (UI should prevent this, but guard here too)
          if (toSave.claimed) {
            sendResponse({ ok: false, error: 'Already claimed' });
            return;
          }
          try {
            const [isClaimed] = await runCheckClaimedManyInOffscreen([toSave]);
            if (isClaimed) {
              sendResponse({ ok: false, error: 'Already claimed' });
              return;
            }
          } catch {}

          // Delegate storing to the offscreen document with LearnCard
          await runStoreInOffscreen(toSave, msg.category);

          // On success, remove the first item and update badge count
          const current = detectedByTab[tabId] ?? [];
          const remaining = current.slice(1);
          detectedByTab[tabId] = remaining;
          const badgeText = remaining.length ? String(remaining.length) : '';
          if (typeof tabId === 'number' && _sender.tab?.id === tabId) {
            chrome.action.setBadgeText({ text: badgeText, tabId });
          } else {
            chrome.action.setBadgeText({ text: badgeText });
          }
          sendResponse({ ok: true });
        } catch (err) {
          console.error('Failed to save credential', err);
          sendResponse({ ok: false, error: (err as Error).message });
        }
      })();
      return true; // keep channel open for async
    }
    case 'save-credentials': {
      (async () => {
        try {
          const msg = message as any as {
            type: 'save-credentials';
            tabId?: number;
            selections: { index: number; category?: CredentialCategory }[];
            candidates?: CredentialCandidate[];
          };
          const tabId = (typeof msg.tabId === 'number' ? msg.tabId : _sender.tab?.id) ?? -1;
          const current = detectedByTab[tabId] ?? [];
          const baseList: CredentialCandidate[] = current.length ? current : Array.isArray(msg.candidates) ? msg.candidates ?? [] : [];
          if (!baseList.length) {
            sendResponse({ ok: false, error: 'No selections' });
            return;
          }
          const indices = (msg.selections ?? [])
            .map((s) => s.index)
            .filter((i) => Number.isInteger(i) && i >= 0 && i < baseList.length);
          const unique = Array.from(new Set(indices));
          if (unique.length === 0) {
            sendResponse({ ok: false, error: 'No selections' });
            return;
          }
          // Double-check claimed status for selected items and filter out already-claimed
          const selectedList = unique.map((i) => baseList[i]);
          let claimedResults: boolean[] = [];
          try {
            claimedResults = await runCheckClaimedManyInOffscreen(selectedList);
          } catch {}
          const allowed = unique.filter((idx, j) => {
            const c = baseList[idx];
            return !(c?.claimed || claimedResults[j]);
          });
          if (allowed.length === 0) {
            sendResponse({ ok: false, error: 'All selected credentials are already claimed' });
            return;
          }
          const items = allowed.map((i) => ({ candidate: baseList[i], category: (msg.selections.find((s) => s.index === i) || {}).category }));

          const { savedCount } = await runStoreManyInOffscreen(items);

          // Remove only saved indices from list
          const remaining = baseList.filter((_, idx) => !allowed.includes(idx));
          detectedByTab[tabId] = remaining; // refresh with remaining list even if we used snapshot
          const badgeText = remaining.length ? String(remaining.length) : '';
          if (typeof tabId === 'number' && _sender.tab?.id === tabId) {
            chrome.action.setBadgeText({ text: badgeText, tabId });
          } else {
            chrome.action.setBadgeText({ text: badgeText });
          }
          sendResponse({ ok: true, savedCount });
        } catch (err) {
          console.error('Failed to save credentials', err);
          sendResponse({ ok: false, error: (err as Error).message });
        }
      })();
      return true;
    }
    // no external message for claimed checks; background uses internal helper
    case 'get-auth-status': {
      (async () => {
        const { authSeed = null, authDid = null } = await storageGet<{
          authSeed: string | null;
          authDid: string | null;
        }>({ authSeed: null, authDid: null });
        sendResponse({ ok: true, data: { loggedIn: Boolean(authSeed), did: authDid || null } });
      })();
      return true;
    }
    case 'start-auth': {
      (async () => {
        try {
          console.log('Starting auth flow');
          const redirectUri = chrome.identity.getRedirectURL('learncard');
          const loginBase = 'http://localhost:3000/login';
          const loginUrl = `${loginBase}?extRedirectUri=${encodeURIComponent(redirectUri)}`;

          chrome.identity.launchWebAuthFlow(
            { url: loginUrl, interactive: true },
            async (responseUrl) => {
              if (chrome.runtime.lastError) {
                sendResponse({ ok: false, error: chrome.runtime.lastError.message });
                return;
              }
              if (!responseUrl) {
                sendResponse({ ok: false, error: 'No response URL from auth flow' });
                return;
              }
              const params = parseParams(responseUrl);
              const seed = params['seed'];
              if (!seed) {
                sendResponse({ ok: false, error: 'No seed found in redirect URL' });
                return;
              }

              try {
                await storageSet({ authSeed: seed });
                const did = await runInitInOffscreen(seed);
                await storageSet({ authDid: did });
                sendResponse({ ok: true, data: { did } });
              } catch (e) {
                sendResponse({ ok: false, error: (e as Error).message });
              }
            }
          );
        } catch (e) {
          sendResponse({ ok: false, error: (e as Error).message });
        }
      })();
      return true; // keep channel open
    }
    case 'get-profile': {
      (async () => {
        try {
          const profile = await runGetProfileInOffscreen();
          sendResponse({ ok: true, profile });
        } catch (err) {
          sendResponse({ ok: false, error: (err as Error).message });
        }
      })();
      return true;
    }
    case 'start-vcapi-exchange': {
      (async () => {
        try {
          const url = (message as any).url as string | undefined;
          const tabId = ((message as any).tabId as number | undefined) ?? _sender.tab?.id ?? -1;
          if (!url) {
            sendResponse({ ok: false, error: 'Missing URL' });
            return;
          }
          vcapiByTab[tabId] = { state: 'contacting', url, error: null } as any;
          const { vcs } = await runVcApiOpenInOffscreen(url);
          vcapiByTab[tabId] = { state: 'offer', url, offers: vcs, error: null } as any;
          sendResponse({ ok: true });
        } catch (err) {
          const tabId = _sender.tab?.id ?? -1;
          vcapiByTab[tabId] = { state: 'error', error: (err as Error).message } as any;
          sendResponse({ ok: false, error: (err as Error).message });
        }
      })();
      return true;
    }
    case 'get-vcapi-exchange-status': {
      const tabId = ((message as any).tabId as number | undefined) ?? _sender.tab?.id ?? -1;
      const session = vcapiByTab[tabId] ?? ({ state: 'idle' } as any);
      sendResponse({ ok: true, data: session });
      return; // synchronous
    }
    case 'accept-vcapi-offer': {
      (async () => {
        try {
          const tabId = ((message as any).tabId as number | undefined) ?? _sender.tab?.id ?? -1;
          const selections = ((message as any).selections as { index: number; category?: CredentialCategory }[]) ?? [];
          const session = vcapiByTab[tabId];
          const offers = Array.isArray(session?.offers) ? session!.offers : [];
          if (!offers.length || !selections.length) {
            sendResponse({ ok: false, error: 'No selections' });
            return;
          }
          vcapiByTab[tabId] = { ...(session as any), state: 'saving' };
          const items = selections
            .filter((s) => Number.isInteger(s.index) && s.index >= 0 && s.index < offers.length)
            .map((s) => ({ vc: offers[s.index], category: s.category }));
          const { savedCount } = await runVcApiAcceptInOffscreen(items);

          // Integrate saved credentials into detected list as claimed
          const current = detectedByTab[tabId] ?? [];
          const claimedItems: CredentialCandidate[] = items.map(({ vc }) => {
            const anyVc = vc as any;
            const title = anyVc?.boostCredential?.name || anyVc?.name || 'Credential';
            return { source: 'jsonld', title, raw: vc, platform: 'unknown', claimed: true } as CredentialCandidate;
          });
          detectedByTab[tabId] = [...current, ...claimedItems];

          vcapiByTab[tabId] = { state: 'success', offers: offers, url: session?.url, error: null } as any;
          sendResponse({ ok: true, savedCount });
        } catch (err) {
          const tabId = _sender.tab?.id ?? -1;
          vcapiByTab[tabId] = { state: 'error', error: (err as Error).message } as any;
          sendResponse({ ok: false, error: (err as Error).message });
        }
      })();
      return true;
    }
    case 'cancel-vcapi-exchange': {
      const tabId = ((message as any).tabId as number | undefined) ?? _sender.tab?.id ?? -1;
      delete vcapiByTab[tabId];
      sendResponse({ ok: true });
      return; // synchronous
    }
    case 'logout': {
      (async () => {
        await storageSet({ authSeed: null, authDid: null });
        sendResponse({ ok: true });
      })();
      return true;
    }
  }
});
