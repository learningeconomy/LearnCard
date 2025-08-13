// Offscreen document script for LearnCard initialization
import { initLearnCard } from '@learncard/init';
import didkitWasmUrl from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';

async function initializeAndGetDid(seed: string): Promise<string | undefined> {
  const learnCard = await initLearnCard({
    seed,
    network: true,
    // In a document context, a plain URL is fine
    didkit: didkitWasmUrl
  });

  return learnCard?.id.did();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target === 'offscreen' && message?.type === 'start-learncard-init') {
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

    // Keep the message channel open for async response
    return true;
  }

  // Not handled here
  return false;
});
