import { useEffect, useState } from 'react';
import { sendMessage, sendTabMessage } from '../../messaging/client';
import type {
  CredentialCandidate,
  CredentialCategory,
  GetDetectedResponse,
  SaveCredentialsMessage,
  SaveCredentialsResponse,
} from '../../types/messages';
import { isVc, getTitleFromVc } from '../../utils/vc';

export type UseInboxOptions = {
  onStatus?: (s: string) => void;
};

export const useInbox = (tabId: number | null, opts: UseInboxOptions = {}) => {
  const { onStatus } = opts;

  const [candidates, setCandidates] = useState<CredentialCandidate[]>([]);

  const [selected, setSelected] = useState<boolean[]>([]);

  const [categories, setCategories] = useState<CredentialCategory[]>([]);

  const [openCategoryIdx, setOpenCategoryIdx] = useState<number | null>(null);

  const [hideClaimed, setHideClaimed] = useState(false);

  const [rescanBusy, setRescanBusy] = useState(false);

  const [analyzeBusy, setAnalyzeBusy] = useState(false);

  const [saving, setSaving] = useState(false);

  // Fetch detected credentials for this tab on mount/tab change
  useEffect(() => {
    const init = async () => {
      const resp = (await sendMessage({ type: 'get-detected', tabId: tabId ?? undefined })) as GetDetectedResponse;
      const list = resp?.ok && Array.isArray(resp.data) ? (resp.data as CredentialCandidate[]) : [];
      setCandidates(list);

      if ((tabId ?? null) !== null && list.length === 0) {
        try {
          await sendTabMessage(tabId!, { type: 'request-scan' });
          const resp2 = (await sendMessage({ type: 'get-detected', tabId: tabId ?? undefined })) as GetDetectedResponse;
          if (resp2?.ok && Array.isArray(resp2.data)) setCandidates(resp2.data as CredentialCandidate[]);
        } catch {
          // ignore
        }
      }
    };

    init();
  }, [tabId]);

  // Keep selection and categories arrays in sync with candidates length and claimed flags
  useEffect(() => {
    setSelected((prev) => {
      const next = candidates.map((c, i) => {
        if (c.claimed) return false;
        if (typeof prev[i] === 'boolean') return prev[i] as boolean;
        return true;
      });
      return next;
    });

    setCategories((prev) => {
      const next = candidates.map((_, i) => (prev[i] ? prev[i] : 'Achievement'));
      return next as CredentialCategory[];
    });
  }, [candidates]);

  const refreshDetected = async () => {
    const resp = (await sendMessage({ type: 'get-detected', tabId: tabId ?? undefined })) as GetDetectedResponse;
    if (resp?.ok && Array.isArray(resp.data)) setCandidates(resp.data as CredentialCandidate[]);
  };

  const dedupe = (list: CredentialCandidate[]) => {
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

  const analyzeClipboard = async () => {
    setAnalyzeBusy(true);
    onStatus?.('Analyzing clipboard…');
    try {
      const text = await navigator.clipboard.readText();
      let found: CredentialCandidate[] = [];

      try {
        const parsed = JSON.parse(text);
        const add = (val: unknown) => {
          if (Array.isArray(val)) return val.forEach(add);
          if (isVc(val)) found.push({ source: 'jsonld', raw: val, title: getTitleFromVc(val), platform: 'unknown' });
        };
        add(parsed);
      } catch {}

      if (found.length === 0) {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          const snippet = text.slice(start, end + 1);
          try {
            const parsed = JSON.parse(snippet);
            if (isVc(parsed)) found.push({ source: 'jsonld', raw: parsed, title: getTitleFromVc(parsed), platform: 'unknown' });
          } catch {}
        }
      }

      if (found.length === 0) {
        onStatus?.('No credential found in clipboard');
        return;
      }

      const merged = dedupe([...found, ...candidates]);
      const resp = await sendMessage({ type: 'credentials-detected', payload: merged, tabId: tabId ?? undefined });
      if ((resp as { ok?: boolean })?.ok) {
        await refreshDetected();
        onStatus?.(`Found ${found.length} credential${found.length === 1 ? '' : 's'} from clipboard`);
      } else {
        onStatus?.('Failed to update detections');
      }
    } catch {
      onStatus?.('Clipboard read failed. Grant clipboard permission and try again.');
    } finally {
      setAnalyzeBusy(false);
    }
  };

  const rescan = async () => {
    if (tabId === null) return;
    onStatus?.('Rescanning page…');
    setRescanBusy(true);
    try {
      await sendTabMessage(tabId, { type: 'request-scan' });
      const resp = (await sendMessage({ type: 'get-detected', tabId })) as GetDetectedResponse;
      if (resp?.ok) {
        const list = Array.isArray(resp.data) ? (resp.data as CredentialCandidate[]) : [];
        setCandidates(list);
        onStatus?.(`Scan complete: ${list.length} credential${list.length === 1 ? '' : 's'} found`);
      } else {
        onStatus?.('Rescan failed');
      }
    } finally {
      setRescanBusy(false);
    }
  };

  const bulkSave = async (): Promise<SaveCredentialsResponse> => {
    const selections = selected
      .map((v, i) => ({ v, i }))
      .filter(({ v, i }) => v && !candidates[i]?.claimed && candidates[i]?.source !== 'link')
      .map(({ i }) => ({ index: i, category: categories[i] }));

    if (selections.length === 0) return { ok: false, error: 'No items selected' } as const;

    setSaving(true);

    const msg: SaveCredentialsMessage = {
      type: 'save-credentials',
      tabId: tabId ?? undefined,
      selections,
      candidates,
    };

    try {
      const resp = (await sendMessage(msg)) as SaveCredentialsResponse;
      if (resp?.ok) {
        await refreshDetected();
      }
      return resp;
    } finally {
      setSaving(false);
    }
  };

  return {
    // state
    candidates,
    selected,
    categories,
    openCategoryIdx,
    hideClaimed,

    rescanBusy,
    analyzeBusy,
    saving,

    // setters
    setSelected,
    setCategories,
    setOpenCategoryIdx,
    setHideClaimed,

    // actions
    refreshDetected,
    analyzeClipboard,
    rescan,
    bulkSave,
  } as const;
};
