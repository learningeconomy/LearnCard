# Verifier history: reviewer quick start

Use the automated walkthrough for a repeatable check without Docker, a personal account,
or an external verifier. Use the live recipes below for interoperability checks.

## Easy automated check

In a checkout of PR #1646 with the monorepo dependencies and workspace packages installed/built:

```bash
cd apps/learn-card-app
bunx playwright install firefox # first run only
bun run qa:verifier-history
```

The command starts its own local Vite server and signs in a synthetic adult account. It
adds a signed **QA University Diploma**, opens the actual selection/review screens, and
asserts:

- Opening Shared loads history automatically; loading uses the same placeholder rows as neighboring sections before the controls appear. Recording defaults off. OID4VP, VC-API and CHAPI send without history storage calls.
- Opting in creates one encrypted entry after each transport. CHAPI is labelled as a
  handoff, not confirmed delivery or acceptance.
- Clicking a verifier entry shows its recorded credential names without storage reads.
- Turning recording off preserves existing entries. Going back from review sends nothing.
- The main page shows five entries; the modal shows 20 per page. Next/Previous make
  no history storage reads. Deleting updates the main card, Escape permits reopening,
  and managed-account eligibility closes the modal.
- Mobile controls fit. Clear asks for confirmation; Cancel makes no storage calls. Confirmed Clear keeps readable consent and the credential remains selectable.

**Pass:** Playwright reports `1 passed` and every named step is green. For screenshots and
step details, open the HTML report:

```bash
bunx playwright show-report playwright-report/verifier-history-qa
```

To watch the automated browser walkthrough instead:

```bash
bun run demo:verifier-history
```

For the fast helper/component suite, including the 90-day/500-entry boundary, unreadable
history, deletion failures and account changes:

```bash
bun run qa:verifier-history:unit
```

These commands use actual application code, signing and holder encryption, but simulated
authentication, storage, verifier responses and CHAPI events. They do not establish live
verifier compatibility, backend authorization, cross-device sync or native recorder exclusion.
The fixture lives under `tests/`; the production application does not import it. History
documents exist only in the test browser's memory. This opt-in walkthrough is separate
from the regular mock-e2e suite.

The default test server is `http://localhost:3010`. If that port is occupied, stop the
other test server or set `PW_MOCK_PORT=3012` before the command. It deliberately refuses
to reuse an independently running server. Do not set `PWHAR=update` for this check.

## Live UI checks

### Setup

Use a build of **this PR**, not the current production app. Have an engineer provide the
running PR build's origin, called `APP_URL` below (for example `http://localhost:3000`).
Local development uses the repository's environment setup and `bun run start` in
`apps/learn-card-app`; the automated QA server above is a separate, simulated environment.

Sign in using a disposable test account with an adult primary profile, not a managed,
child, service or switched profile. Use synthetic credentials only. Start with an account
that has never enabled recording if testing the default; Clear does **not** reset readable
consent. Make sure the account has at least one test credential visible in its credential
list. Receiving/claiming a credential is setup and should not create an outgoing entry.

Open `APP_URL/privacy-and-data`, find **Shared with verifiers**, and
wait for history to load automatically. Confirm **Keep private history** is unchecked.

### Launch a request with VC Playground

Open [VC Playground](https://vcplayground.org/) in the same browser. Select
**Verifier Demo**, then **Any VC**. Use the credential-version tab that matches your test
credential (the synthetic diploma used by the automated walkthrough is VC 1.1).
Generate a **fresh request for every send**; a completed or expired exchange is not reusable.

| Flow   | Steps to open the PR's send screen                                                                                                                                                                                                                                                                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OID4VP | Click **Generate a QR Code**, select **OID4VP**, and copy the entire **Value of the QR code** beginning `openid4vp://`. In the PR app, open the add menu's **Use a Claim Link** screen, paste it and click **Continue**. This routes to `/oid4vp?request=…`.                                                                                                                        |
| VC-API | Click **Generate a QR Code**, select **Multiple Protocols (via VC API)** and copy **Value of the QR code**. For the Playground URL format below, replace the `https://vcplayground.org/interactions/` prefix with `APP_URL/request?vc_request_url=` and remove the final `?iuv=1`. Open the resulting address in the same browser. This explicitly selects VC-API.                  |
| CHAPI  | In the PR app, use **Connect Handler** to register that origin in this browser. Back in Playground, click **Request Verifiable Presentation**, then choose the handler whose domain equals `APP_URL`. Choose **Show Wallet Chooser** if offered. If only `learncard.app` is listed while your PR build is elsewhere, stop: that handler opens production and does not test this PR. |

VC-API address conversion (keep the encoded middle unchanged; substitute your actual app origin):

```text
Copied: https://vcplayground.org/interactions/https%3A%2F%2Fsandbox.platform.veres.dev%2Fworkflows%2FWORKFLOW%2Fexchanges%2FEXCHANGE?iuv=1
Open:   APP_URL/request?vc_request_url=https%3A%2F%2Fsandbox.platform.veres.dev%2Fworkflows%2FWORKFLOW%2Fexchanges%2FEXCHANGE
```

`WORKFLOW`/`EXCHANGE` are explanatory placeholders, not usable test links. If Playground
changes this URL shape, an engineer should resolve the interaction's `protocols.vcapi`
value and build `/request?vc_request_url=<URL-encoded exchange URL>` instead. Simply
pasting a multiple-protocol interaction into LearnCard may prefer OID4VP and does not prove
VC-API was tested. [Playground interaction documentation](https://vcplayground.org/docs/chapi/wallets/interaction-url/).

The launch controls were inspected on October 7, 2026; a successful live end-to-end send
is not claimed here. An earlier production CHAPI issuer attempt stalled at **Loading
Wallet**. If a handler stalls or a verifier rejects the presentation, report the protocol,
app origin and error; mark that live check blocked, not passed. Do not assume the simulated
QA run proves this external integration works.

**Issuer Demo is for obtaining a test credential.** Its **Issue Verifiable Credential →
Show Wallet Chooser → LearnCard** flow receives a credential; it is not the outbound CHAPI
history test. It also requires selecting the PR origin's registered handler.

### What to check after sending

For each protocol, run once with recording off, then enable recording and generate a
new request to run again:

1. Select the test credential, review it and send. For CHAPI/VC-API, also try search,
   category filters, **View selected**, review deselection and **Go back**. Only the
   final reviewed selection should be sent; going back or cancelling sends nothing.
2. Return to **Shared with verifiers** and click **Refresh**. With recording off there
   should be no new entry. With recording on there should be one new entry with
   the title and current timestamp. OID4VP/VC-API say **Sent; acceptance unknown**;
   CHAPI says **Handed to the application; delivery unconfirmed**. Generic requesting-app
   text is expected when no verifier identity was available during review.
3. Turn recording off: previous entries remain. Delete a test entry and confirm the
   credential remains in the account. Enable recording again, then Clear readable history:
   the list empties and **Keep private history** stays checked. This cannot undo a prior send.
4. With more than five entries, confirm the five-item preview and **View all** modal.
   With more than 20, check Next/Previous. Use the automated fixture for this instead of
   manually sending hundreds of credentials. Check desktop and mobile widths.

## Engineering privacy checks

“No pre-send history requests” means the disclosure path does not call the history storage
methods before transport. Opening/refreshing history intentionally reads storage; normal
credential-loading traffic is also expected. The automated walkthrough checks the call
order directly and the unit suite checks consent recovery without pre-send Cloud traffic.
This assertion cannot be inferred from an empty history screen alone.

The browser fixture checks that a private-session flag is active and stored ciphertext
does not contain the test title. The helper suite additionally checks the server-decrypted
LearnCloud envelope still contains a holder-encrypted receipt and unrelated holder keys
cannot decrypt it. These are narrower checks than comprehensive capture exclusion.

Keep live backend authorization, cross-device consent/deletion races, failure injection
and platform recorder checks with an engineer. Do not ask general reviewers to corrupt
storage or inspect personal-account data. Native builds and Arabic RTL are outside the
current recorded walkthrough.
