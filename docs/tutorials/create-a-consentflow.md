---
description: Link a learner's LearnCard once, then read their data and issue to them automatically — with their permission.
---

# Connect a User's LearnCard to Your Platform

A learner links their LearnCard to your platform once and chooses what you may read and write. LearnCard calls this a [ConsentFlow](../core-concepts/consent-and-permissions/consentflow-overview.md). This tutorial asks for an optional name and permission to send achievements.

## Do you need this, or just send()?

- **Just awarding a badge?** If you know the user's email, use [`send()`](../how-to-guides/send-credentials.md) — it's simpler and requires no setup for the user.
- **Ongoing relationship?** Use this pattern. The user links their LearnCard once and consents to what you may read/write. You then issue automatically (every lesson, every level) with no emails or claim links — this is what AI tutors, LMSs, and games need.

{% hint style="info" %}
**For games and platforms serving minors:** add `needsGuardianConsent: true` to the contract. This makes it a [GameFlow](../core-concepts/consent-and-permissions/gameflow-overview.md) contract, and LearnCard requires guardian approval for users under the age of digital consent before they can link.
{% endhint %}

Guardian approval for a _single_ sent credential is a different, simpler thing: use `options.guardianEmail` on `send()`. See [Guardian-gated credentials](../how-to-guides/send-credentials.md#guardian-gated-credentials).

## Prerequisites

- Node.js 20.6 or newer and a separate LearnCard account to test consent.
- A server-only project with `@learncard/init` installed: `npm install @learncard/init`.
- An HTTPS endpoint you control that forwards `/consent-callback` to this example's local port 3000.
- Save all five `.mjs` files below in the same folder.

Set `SECURE_SEED`, `PROFILE_ID`, and `RETURN_TO` in a private `.env` file. Generate a 32-byte hex seed with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Choose a unique service profile handle for `PROFILE_ID`. Set `RETURN_TO` to your real HTTPS callback URL, ending in `/consent-callback`.

Never commit `.env` or put the seed in browser code. Disable callback query-string logging in your proxy, analytics, and application: the presentation in the URL is sensitive.

## 1. Create the contract

Save as `create-contract.mjs`. It creates your service profile if absent, then a new contract. Errors are not treated as successful profile creation.

<!-- snippet: consentflow/create-contract.mjs -->

```javascript
import { initLearnCard } from '@learncard/init';

const { SECURE_SEED, PROFILE_ID, RETURN_TO } = process.env;
if (!SECURE_SEED || !PROFILE_ID || !RETURN_TO) {
    throw new Error('Set SECURE_SEED, PROFILE_ID, and RETURN_TO');
}
const returnTo = new URL(RETURN_TO);
if (returnTo.protocol !== 'https:') throw new Error('RETURN_TO must use HTTPS');

const learnCard = await initLearnCard({ seed: SECURE_SEED, network: true });
if (!(await learnCard.invoke.getProfile())) {
    await learnCard.invoke.createServiceProfile({
        profileId: PROFILE_ID,
        displayName: 'ConsentFlow Tutorial',
    });
}

const contractUri = await learnCard.invoke.createContract({
    name: 'ConsentFlow Tutorial',
    subtitle: 'Receive a tutorial badge',
    description: 'Allow us to read your name and send an achievement.',
    redirectUrl: returnTo.toString(),
    contract: {
        read: {
            personal: { name: { required: false } },
            credentials: { categories: {} },
        },
        write: {
            personal: {},
            credentials: { categories: { Achievement: { required: true } } },
        },
    },
});

const consentUrl = new URL('https://learncard.app/consent-flow');
consentUrl.searchParams.set('uri', contractUri);
consentUrl.searchParams.set('returnTo', returnTo.toString());
console.log(JSON.stringify({ contractUri, consentUrl: consentUrl.toString() }));
```

<!-- /snippet -->

Run `node --env-file=.env create-contract.mjs`. Save the returned `contractUri` as `CONTRACT_URI` in `.env`. Keep the same seed for every step. Each run creates a new contract; reuse the saved URI rather than rerunning setup.

## 2. Send the user to consent

Open the printed `consentUrl` with your test account, or use that exact URL as your site's consent link. Its form is `https://learncard.app/consent-flow?uri=<encoded contractUri>&returnTo=<encoded URL>`; the script encodes both values.

`returnTo` overrides the contract's `redirectUrl`. LearnCard accepts HTTP or HTTPS; this example requires HTTPS. The learner can omit their name but must allow achievement issuance.

## 3. Handle the redirect

Save as `consent-callback.mjs`. Run `node --env-file=.env consent-callback.mjs` before accepting the contract.

The redirect includes `did` (a convenience identifier) and `vp` (a signed JSON Web Token presentation). **Never trust `did` alone.** Verify `vp` server-side, then read its holder and match its contract URI. The SDK's JWT payload has `iss` and `vp.holder`; this example requires them to agree.

<!-- snippet: consentflow/consent-callback.mjs -->

```javascript
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
```

<!-- /snippet -->

Declining does not produce a redirect with a presentation. If the learner returns without `vp`, treat the attempt as denied or abandoned—not successful consent. Closing the consent page produces no callback at all.

{% hint style="warning" %}
This endpoint confirms consent; it is **not a sign-in or account-linking endpoint**. The ordinary redirect has no application-bound signed nonce, so a valid presentation can be replayed. Do not create sessions, bind local accounts, expose personal data, or issue credentials on this GET. A production account-linking flow needs separately authenticated, session-bound proof and replay protection. A valid signature also does not prove consent is still active: check the network before each use.
{% endhint %}

## 4. Read that user's data

Save as `read-user-data.mjs`. The callback uses the verified `userDid` directly. For a server-side command-line test, copy the `vp` value from your own test callback into `CONSENT_VP` in the private `.env` file, then run `node --env-file=.env read-user-data.mjs`.

<!-- snippet: consentflow/read-user-data.mjs -->

```javascript
import { pathToFileURL } from 'node:url';
import { initLearnCard } from '@learncard/init';
import { verifyConsentRedirect } from './consent-callback.mjs';

export const readUserData = async (learnCard, userDid, contractUri) => {
    const profile = await learnCard.invoke.getProfile(userDid);
    if (!profile) return [];
    const hasAccess = () => learnCard.invoke.verifyConsent(contractUri, profile.profileId);
    if (!(await hasAccess())) return [];
    const records = [];
    let cursor;
    do {
        const page = await learnCard.invoke.getConsentFlowDataForDid(userDid, {
            limit: 100,
            ...(cursor ? { cursor } : {}),
        });
        records.push(...page.records.filter(record => record.contractUri === contractUri));
        if (!page.hasMore) return (await hasAccess()) ? records : [];
        if (!page.cursor || page.cursor === cursor) throw new Error('Pagination did not advance');
        cursor = page.cursor;
    } while (true);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { SECURE_SEED, CONTRACT_URI, CONSENT_VP } = process.env;
    if (!SECURE_SEED || !CONTRACT_URI) throw new Error('Set SECURE_SEED and CONTRACT_URI');
    const learnCard = await initLearnCard({ seed: SECURE_SEED, network: true });
    const verified = await verifyConsentRedirect(learnCard, CONSENT_VP, CONTRACT_URI);
    if (verified.status !== 'verified') throw new Error('Consent denied or abandoned');
    const records = await readUserData(learnCard, verified.userDid, CONTRACT_URI);
    console.log(
        records.length ? `Active consent: ${records.length} record(s).` : 'No active consent.'
    );
}
```

<!-- /snippet -->

The function checks live consent before reading and again before returning, follows every page, and keeps only records for `contractUri`. Each record has `personal` (a string map) and `credentials` (an array of `{ category, uri }`), not nested category arrays. An omitted optional name is not evidence of missing consent.

`getConsentFlowData(contractUri)` returns all users' data without an identity field. Do not use it for per-user lookup. No matching records means no accessible data for this contract; deny access rather than guessing which user a record belongs to. Network errors also fail closed.

## 5. Issue a credential through the contract

Save as `issue-through-contract.mjs`. Run `node --env-file=.env issue-through-contract.mjs` once after completing the tutorial.

<!-- snippet: consentflow/issue-through-contract.mjs -->

```javascript
import { pathToFileURL } from 'node:url';
import { initLearnCard } from '@learncard/init';
import { verifyConsentRedirect } from './consent-callback.mjs';
import { readUserData } from './read-user-data.mjs';

export const issueThroughContract = async (learnCard, userDid, contractUri) => {
    if ((await readUserData(learnCard, userDid, contractUri)).length === 0) {
        throw new Error('No active consent');
    }
    const base = learnCard.invoke.newCredential({ type: 'boost' });
    const unsignedCredential = {
        ...base,
        issuer: learnCard.id.did(),
        name: 'ConsentFlow Tutorial Complete',
        credentialSubject: {
            ...base.credentialSubject,
            id: userDid,
            achievement: {
                ...base.credentialSubject.achievement,
                name: 'ConsentFlow Tutorial Complete',
                description: 'Completed the ConsentFlow tutorial.',
            },
        },
    };
    const boostUri = await learnCard.invoke.createBoost(unsignedCredential, {
        name: 'ConsentFlow Tutorial Complete',
        category: 'Achievement',
        type: 'achievement',
    });
    const signedCredential = await learnCard.invoke.issueCredential({
        ...unsignedCredential,
        boostId: boostUri,
    });
    return learnCard.invoke.writeCredentialToContract(
        userDid,
        contractUri,
        signedCredential,
        boostUri
    );
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { SECURE_SEED, CONTRACT_URI, CONSENT_VP } = process.env;
    if (!SECURE_SEED || !CONTRACT_URI) throw new Error('Set SECURE_SEED and CONTRACT_URI');
    const learnCard = await initLearnCard({ seed: SECURE_SEED, network: true });
    const verified = await verifyConsentRedirect(learnCard, CONSENT_VP, CONTRACT_URI);
    if (verified.status !== 'verified') throw new Error('Consent denied or abandoned');
    const credentialUri = await issueThroughContract(learnCard, verified.userDid, CONTRACT_URI);
    console.log(`Issued: ${credentialUri}`);
}
```

<!-- /snippet -->

`boostUri` is the actual value returned by `createBoost`, never a fabricated identifier. The network enforces current write permission for its `Achievement` category, including withdrawal between the read and write calls. Running this command again creates another template and credential; production issuance needs your own idempotency control and an authorized completion event.

## 6. Handle withdrawal

The learner withdraws in LearnCard; the underlying call is `withdrawConsent(termsUri)`, where `termsUri` comes from their consent record—not the contract URI. Your issuer cannot withdraw on their behalf.

Save as `handle-withdrawal.mjs`. Import `refreshAccess` into server jobs and call it with the same verified `userDid` and `contractUri` before using cached data. This example removes the cached entry first, even if a subsequent network call fails.

<!-- snippet: consentflow/handle-withdrawal.mjs -->

```javascript
import { readUserData } from './read-user-data.mjs';

// This example's only cache. Never serve it without a fresh access check.
export const consentCache = new Map();

export const refreshAccess = async (learnCard, userDid, contractUri) => {
    const key = JSON.stringify([contractUri, userDid]);
    consentCache.delete(key);
    const records = await readUserData(learnCard, userDid, contractUri);
    if (records.length === 0) return false;
    consentCache.set(key, records);
    return true;
};
```

<!-- /snippet -->

The shared read function uses `getProfile(userDid)` to resolve the identifier to a profile, then passes its `profileId` to `verifyConsent`. A hidden or unavailable profile denies access here. After withdrawal, `verifyConsent` returns false and the guarded read returns no records. Do not rely on record presence alone: the current per-user data query can retain withdrawn terms. Stop pending issuance and delete any persistent copies too. In a production cache, run these checks periodically as well as before use; do not keep personal data indefinitely when a learner stops visiting.

## What you should see

1. Setup prints JSON containing a real `contractUri` and `consentUrl`.
2. Accepting consent returns **Consent verified. Active access confirmed.**
3. The read command prints **Active consent: 1 record(s).** for this single-contract example, even if the optional name was omitted.
4. Issuance prints **Issued:** followed by the credential URI. The learner can retrieve it through their contract.
5. After withdrawal, reading prints **No active consent.** Issuance stops with **No active consent**. Refreshing access returns `false` and removes the cached entry.

## Troubleshooting

| Message                                                                          | Fix                                                                                    |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `Could not find contract`                                                        | Use the exact saved `CONTRACT_URI` and the same network.                               |
| `Invalid Terms for Contract`                                                     | Accept all required permissions; terms must match the contract.                        |
| `You've already consented to this contract!`                                     | Use the existing consent record instead of consenting twice.                           |
| `Could not find profile for did`                                                 | Confirm the verified holder has a profile on this network.                             |
| `Target profile has not consented to this contract`                              | Obtain active consent before writing; stop after withdrawal.                           |
| `Target profile has not consented to receive boosts in the Achievement category` | Obtain write permission for `Achievement`.                                             |
| `Profile does not have permissions to issue boost`                               | Use a template owned by, or issuable by, your service.                                 |
| `Wrong consent contract`                                                         | The verified presentation belongs to another contract. Start the correct flow.         |
| `Unable to confirm consent. Try again.`                                          | Check server connectivity and restart consent. Never fall back to the `did` parameter. |

## Next steps

- See a runnable game example: [Gashapon Game Corner](https://github.com/learningeconomy/LearnCard/tree/main/examples/app-store-apps/4-gashapon-game-corner)
- [Auto-issuance](../core-concepts/consent-and-permissions/auto-boosts.md) sends credentials when consent is accepted, using a registered signing authority.
- [User consent and terms](../core-concepts/consent-and-permissions/consentflow-overview.md#terms-what-the-user-actually-agreed-to) covers permission updates and withdrawal.
- [Reading & Writing Consented Data](../core-concepts/consent-and-permissions/writing-consented-data.md#reading) explains data access beyond this example.
