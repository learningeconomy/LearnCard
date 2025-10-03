import { useCallback, useEffect, useState } from 'react';
import { sendMessage } from '../../messaging/client';
import type {
  AcceptVcApiOfferResponse,
  CancelVcApiExchangeResponse,
  CredentialCandidate,
  CredentialCategory,
  GetVcApiExchangeStatusResponse,
  StartVcApiExchangeResponse,
  VcApiExchangeState,
} from '../../types/messages';
import { toErrorString } from '../../utils/errors';

export type UseExchangeOptions = {
  onStatus?: (s: string) => void;
};

export const useExchange = (tabId: number | null, opts: UseExchangeOptions = {}) => {
  const { onStatus } = opts;

  const [url, setUrl] = useState('');

  const [state, setState] = useState<VcApiExchangeState>('idle');

  const [offers, setOffers] = useState<unknown[]>([]);

  const [selected, setSelected] = useState<boolean[]>([]);

  const [categories, setCategories] = useState<CredentialCategory[]>([]);

  const [openCatIdx, setOpenCatIdx] = useState<number | null>(null);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [autoPrefilled, setAutoPrefilled] = useState(false);

  const [show, setShow] = useState(false);

  const refreshStatus = useCallback(() => {
    sendMessage({ type: 'get-vcapi-exchange-status', tabId: tabId ?? undefined }).then((resp) => {
      const r = resp as GetVcApiExchangeStatusResponse;
      if (!r?.ok) return;

      const sess = (r.data || { state: 'idle' }) as {
        state: VcApiExchangeState;
        url?: string;
        offers?: unknown[];
        error?: string | null;
      };

      setState(sess.state);
      if (sess.url) setUrl(sess.url);
      setError(sess.state === 'error' ? toErrorString(sess.error ?? 'Unknown error') : null);

      if (Array.isArray(sess.offers)) {
        setOffers(sess.offers);
        setSelected(sess.offers.map(() => true));
        setCategories(sess.offers.map(() => 'Achievement' as CredentialCategory));
      } else {
        setOffers([]);
        setSelected([]);
        setCategories([]);
      }

      if (sess.state === 'contacting' || sess.state === 'saving') {
        window.setTimeout(() => refreshStatus(), 600);
      }
    });
  }, [tabId]);

  // Sync Exchange session from background when tabId becomes available
  useEffect(() => {
    if (tabId === null) return;
    refreshStatus();
  }, [tabId, refreshStatus]);

  const start = async (): Promise<StartVcApiExchangeResponse> => {
    const trimmed = url.trim();
    if (!trimmed) return { ok: false, error: 'Missing URL' } as const;

    setBusy(true);
    setError(null);
    onStatus?.('Starting exchange…');

    const resp = (await sendMessage({ type: 'start-vcapi-exchange', url: trimmed, tabId: tabId ?? undefined })) as StartVcApiExchangeResponse;

    setBusy(false);

    if (resp?.ok) {
      setState('contacting');
      refreshStatus();
    } else {
      const err = toErrorString((resp as { error?: string })?.error ?? 'Failed to start');
      setError(err);
      setState('error');
      onStatus?.(`Failed to start: ${err}`);
    }

    return resp;
  };

  const cancel = async (): Promise<CancelVcApiExchangeResponse> => {
    const resp = (await sendMessage({ type: 'cancel-vcapi-exchange', tabId: tabId ?? undefined })) as CancelVcApiExchangeResponse;

    setState('idle');
    setOffers([]);
    setSelected([]);
    setCategories([]);
    setOpenCatIdx(null);
    setBusy(false);
    setError(null);
    setShow(false);

    return resp;
  };

  const accept = async (): Promise<AcceptVcApiOfferResponse> => {
    const selections = selected
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v)
      .map(({ i }) => ({ index: i, category: categories[i] }));

    if (selections.length === 0) return { ok: false, error: 'No items selected' } as const;

    setBusy(true);
    onStatus?.('Claiming…');

    const resp = (await sendMessage({ type: 'accept-vcapi-offer', selections, tabId: tabId ?? undefined })) as AcceptVcApiOfferResponse;

    setBusy(false);

    if (resp?.ok) {
      setState('success');
      const count = resp.savedCount;
      onStatus?.(`Saved ${count} credential${count === 1 ? '' : 's'} to LearnCard`);
    } else {
      const err = toErrorString((resp as { error?: string })?.error ?? 'Unknown error');
      setState('error');
      setError(err);
      onStatus?.(`Failed: ${err}`);
    }

    return resp;
  };

  const prefillFromCandidates = (cands: CredentialCandidate[]) => {
    if (state !== 'idle') return;
    if (autoPrefilled) return;
    if (url.trim()) return;

    const link = cands.find((c) => c.source === 'link' && !!c.url && !c.claimed);
    if (link?.url) {
      setUrl(link.url);
      setAutoPrefilled(true);
      onStatus?.('Detected offer URL from page');
      setShow(true);
    }
  };

  return {
    // state
    url,
    state,
    offers,
    selected,
    categories,
    openCatIdx,
    busy,
    error,
    autoPrefilled,
    show,

    // setters
    setUrl,
    setSelected,
    setCategories,
    setOpenCatIdx,
    setShow,

    // actions
    refreshStatus,
    start,
    cancel,
    accept,
    prefillFromCandidates,
  } as const;
};
