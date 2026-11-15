// LearnCard integration: award the Golden Quack badge when the player wins.
//
// The game holds no keys or secrets. It asks the LearnCard host (the wallet the
// game is embedded in) to issue the badge; LearnCard signs it as this app's
// listing, on behalf of the account that owns the listing.
//
// Three modes, picked once at load:
//   embedded  - inside a LearnCard frame: real issuance through Partner Connect.
//   practice  - standalone with ?lc_practice=1: the SDK's practice host, which
//               fakes issuance and records the template so the app can be
//               published from its own page.
//   standalone - anything else: the SDK is never loaded and nothing is sent.

export const GOLDEN_QUACK_ALIAS = 'golden-quack';

const BADGE_IMAGE_URL =
    import.meta.env.VITE_BADGE_IMAGE_URL || 'https://kindly-bamboo-48ky.here.now/duck-badge.png';

// Kept constant: LearnCard versions the badge template by its content, so any
// change here becomes a new template version for the listing.
export const GOLDEN_QUACK_TEMPLATE = {
    name: 'Golden Quack',
    description:
        'Awarded for guiding Duck Jones through the Temple of the Golden Quack and escaping with the idol.',
    image: BADGE_IMAGE_URL,
    issuerName: 'Duck Jones',
    achievementType: 'Badge',
    criteria: {
        narrative:
            'Reach the Golden Quack idol at the end of the temple run before the boulder catches you.',
    },
    tags: ['game', 'duck-jones'],
};

const inFrame = () => {
    try {
        return window.self !== window.top;
    } catch {
        return true;
    }
};

const params = new URLSearchParams(location.search);

export const mode = inFrame()
    ? 'embedded'
    : params.get('lc_practice') === '1'
      ? 'practice'
      : 'standalone';

let sdkPromise = null;

// Loaded on demand so a standalone run never downloads or starts the SDK.
const getSdk = () => {
    if (!sdkPromise) {
        sdkPromise = import('@learncard/partner-connect').then(({ createPartnerConnect }) =>
            createPartnerConnect(
                mode === 'practice'
                    ? { mock: 'standalone', mockOptions: { appId: 'duck-jones' } }
                    : { hostOrigin: 'https://learncard.app', mock: false }
            )
        );
    }
    return sdkPromise;
};

// status: idle | claiming | issued | already | failed | unavailable
const state = {
    mode,
    status: mode === 'standalone' ? 'unavailable' : 'idle',
    error: null,
    result: null,
};
const listeners = new Set();
const set = patch => {
    Object.assign(state, patch);
    listeners.forEach(fn => fn({ ...state }));
};

export const onLearnCardChange = fn => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};
export const learnCardState = () => ({ ...state });

// Warm the SDK early inside LearnCard so the win screen doesn't wait on a chunk.
export const preloadLearnCard = () => {
    if (mode !== 'standalone') getSdk().catch(() => undefined);
};

export const claimGoldenQuack = async () => {
    if (mode === 'standalone' || state.status === 'claiming') return learnCardState();
    set({ status: 'claiming', error: null });
    try {
        const sdk = await getSdk();
        const result = await sdk.sendCredential({
            alias: GOLDEN_QUACK_ALIAS,
            template: GOLDEN_QUACK_TEMPLATE,
            preventDuplicateClaim: true,
        });
        set({
            status: result && result.alreadyClaimed ? 'already' : 'issued',
            result: result || null,
        });
    } catch (err) {
        set({
            status: 'failed',
            error: {
                code: (err && err.code) || 'UNKNOWN_ERROR',
                message: (err && err.message) || String(err),
            },
        });
    }
    return learnCardState();
};
