[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/cli

[![npm version](https://img.shields.io/npm/v/@learncard/cli)](https://www.npmjs.com/package/@learncard/cli)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/cli)](https://www.npmjs.com/package/@learncard/cli)
[![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@learncard/cli)](https://www.npmjs.com/package/@learncard/cli)

**LearnCard CLI** is an easy to use node REPL that instantiates a Learn Card wallet for you and gives
you all the tools you need to easily play around with the Learn Card SDK!

![LearnCard CLI](https://user-images.githubusercontent.com/2185016/201382605-13eb7bb2-f6b6-4099-97a1-1a623bf58486.gif)

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Usage

### Send your first credential

```bash
npx @learncard/cli send you@example.com
```

Generates a seed into `.env`, creates your issuer profile, sends a "Quickstart Complete" badge to the address, and writes the code it ran to `./send.mjs`. Pass `--yes` to accept defaults; `--name "Acme"`, `--badge "Welcome to Acme"`, `--description`, and `--profile-id` set them explicitly. Walkthrough: https://docs.learncard.com/start-here/your-first-integration

### Demonstrate credential refresh

Run a guided, real-network demonstration without writing code:

```bash
learncard demo refresh
```

Press Enter between each step: send a **Provisional Course Certificate**, publish a
**Final Course Certificate**, then refresh the recipient's copy. The CLI shows the
before and after and verifies that the credential keeps its identity. It uses the
existing `sendBoost` flow with `enableRefresh: true` and publishes using the receipt
returned by that send. No second badge is sent.

The default network is `http://localhost:4000/trpc`. A developer must first start
the local services with managed refresh enabled. To present against staging once
LC-2198's service and SDK changes are deployed, use `learncard demo refresh --network staging`.
This command requires a CLI build containing this feature; it is not available in
older published versions. From this branch's repository root, run:

```bash
bun --cwd packages/learn-card-cli start demo refresh
```

By default, each run creates two demo accounts and a badge on the selected network. Keys stay
in memory, and those demo records remain on the network after the command exits.
The demo does not use your `.env` identity or send email. The refreshed copy is
shown in the CLI session; it is not saved to the LearnCard app.

Use `--yes` to run without pauses, or `--json` for a machine-readable result.

#### Show the certificate and notifications in the local app

Start the normal local app stack first (from `apps/learn-card-app`, run
`bun run lc dev learncard local full`).
Once the app is available at `http://localhost:3000`, run this in a second terminal
from the repository root:

```bash
bun --cwd packages/learn-card-cli start demo refresh --ui
```

1. Follow the printed sign-in link to enter a fresh **Refresh Demo Learner** account.
   If already signed in, switch to the demo account when prompted.
2. Press Enter in the terminal to send the certificate. In the app, open **Alerts →
   Claim → Accept**, skip the optional connection prompt, then view
   **Provisional Course Certificate** in **Passport → Achievements**.
   Open it to see **Provisional Results** and **Final grade: Pending** on the full certificate.
3. Press Enter in the terminal to publish the final certificate. The command checks that
   the app has saved the original first.
4. Reload the app if needed and open **Alerts**. Select the notification that the school
   updated a credential. The app retrieves and verifies **Final Course Certificate**,
   replacing the existing copy. Open it to see **Final Results** and **Final grade: A**.
5. Press Enter in the terminal to confirm. The CLI checks that the updated credential
   was actually saved by the app and verifies it.

Keep the terminal open throughout. The sign-in link grants access to this disposable demo
account; keep it private and use it only for test data. The CLI does not write account keys
to files, but the recipient remains signed into the browser after the demo. Rerunning
creates fresh accounts. UI mode requires an interactive terminal and cannot be combined
with `--yes`, `--json`, or `LC_YES=1`.

For a different local app port, pass `--app-url http://localhost:3001`. The CLI reads
the app's served `tenant-config.json` to use the same LearnCloud and notification services.
Both the app and all these services must use loopback URLs, and `--network` must match
the app's Brain service. Local refresh trust is automatic in the development app.
If using the E2E service stack instead of the normal app stack, set the generated app
config's `apis.lcaApi` to `http://localhost:5200/trpc` and `apis.notificationsEndpoint`
to `http://localhost:5200/api/notifications/send` before starting the demo. Do not run
database-resetting E2E tests during a demonstration.

#### Receive the claim at your own email (opt-in real email)

Use `--email` to run the Universal Inbox lifecycle against an address you own. The CLI asks
the locally configured delivery service to email a **provisional** claim link, you claim it
in the app, then the school publishes a single visible **final** update.

```bash
bun --cwd packages/learn-card-cli start demo refresh --inbox --ui --email you@example.com
```

`--email` without a value prompts for the address. It requires `--inbox`, `--ui`, and an
interactive terminal, and the address is validated before any account is created. The
walkthrough is:

1. **Issue provisional results.** The CLI asks the delivery service to email a claim link
   for a **Provisional Course Certificate** to your address. It reports only that delivery
   was requested; it never claims the email was sent or received.
2. **Claim in the app.** Open the mailbox link, sign in or create an account **using that
   same address**, and claim the provisional certificate. Keep the app open.
3. **Publish final results.** Return to the terminal and press Enter. The CLI reads the
   issuer's inbox-credential record for the bound holder DID, then publishes
   **Final Certificate / Final grade: A** as the single visible update (version 2). That
   publication requests an in-app notification and a update email with the issuer and certificate name prompting you to
   log in and view notifications.
4. **View the update.** Open the app notifications to see the final certificate. The CLI
   never creates, signs in as, or reads the recipient wallet, so it does not verify the
   wallet contents and cannot confirm that any email or notification was delivered.

Real email mode is local-only like the rest of the inbox demo. It never suppresses
delivery, and it never publishes a hidden pre-claim version: version 2 is the only update.

> **Operator setup.** `--email` only requests delivery. The operator must enable and
> configure the local email adapter/delivery service first; otherwise no email is sent. In
> the local test mode the adapter logs the message instead of sending it, so open the link
> on the same computer that runs the app. The CLI cannot verify that an address is
> deliverable, and it masks the address in `--json` output.

#### Advanced: refresh for a recipient who has no account yet (disposable preclaim path)

This path exercises the deferred Universal Inbox mechanics — including publishing an update
_before_ any holder exists — with a fake `@example.com` address and suppressed delivery. It
is not the recommended mail walkthrough; use `--email` above for that.

The direct demo sends to a profile that already exists. Add `--inbox` to exercise the
deferred Universal Inbox path: the school issues a refreshable certificate to a random
`@example.com` address with no LearnCard account, publishes a new version **before**
anyone claims, and only then is a real holder bound and sent an update. Email delivery
is suppressed, so the CLI shows the claim link instead of mailing it.

```bash
bun --cwd packages/learn-card-cli start demo refresh --inbox
```

Press Enter through four stages:

1. **Issue provisional results.** Queues a **Provisional Course Certificate** for the
   demo address. Nothing is emailed and there is no recipient to notify.
2. **Publish final results before claim.** The school publishes **Final Results /
   Final grade: A**. Because no holder exists yet, the publication reports
   `notification: "not-applicable"`; nothing is announced.
3. **Claim.** The CLI claims with a fresh local wallet using a real DIDAuth
   presentation, exactly like the app. It receives the newest version (final results),
   verifies the proof, and confirms the same credential identity.
4. **Publish honors results.** Now that the claim has bound the holder DID, the school
   publishes **Honors Results / Final grade: A+**. The holder refreshes and verifies
   that the same credential now shows the honors version.

`--yes` runs every stage without pausing; `--json` prints one machine-readable result
with no seeds, tokens, or claim links. Terminal mode is local-only (it rejects a
non-loopback `--network`) and needs the local LCA signing service. `--lca-url` defaults
to `http://localhost:5100/trpc`; pass `--lca-url http://localhost:5200/trpc` when
presenting against the E2E stack on port 5200.

For the guided app experience, start the normal local app stack as above and run:

```bash
bun --cwd packages/learn-card-cli start demo refresh --inbox --ui
```

The CLI reads Brain, LearnCloud, LCA, and notification services from the app's
`tenant-config.json` and requires them all to be loopback, just like the direct demo.

1. Press Enter to start, then follow the terminal prompts to issue provisional results
   and publish **Final Results / Final grade: A** before the recipient account exists.
2. Press Enter to create the demo recipient. Open the printed **sign-in link** and choose
   **Switch account** if prompted. It takes you directly to the claim screen; the
   separate claim link is also printed. Keep both links private.
3. Click **Claim my credential → Accept**. The first certificate already shows final
   results, not provisional results. Find it in **Passport → Achievements**.
   This first delivery uses a claim link because there was no account to notify at issue time.
4. Return to the terminal and press Enter to confirm the certificate is saved, then
   Enter again to publish the honors update. Early confirmation keeps the demo waiting.
5. Open **Alerts → “Inbox Demo School updated one of your credentials” → View Credential**.
   Reload if the notification is not visible yet. The certificate now shows
   **Honors Results / Final grade: A+**.
6. Press Enter in the terminal to finish. The CLI verifies that the app replaced the
   same entry (not a duplicate) and that the saved certificate has a valid signature.

In `--ui` mode the CLI never claims, accepts, refreshes, or saves on the app's behalf;
a human performs every app action. Rerunning creates fresh accounts. This mode requires
an interactive terminal and cannot be combined with `--yes`, `--json`, or `LC_YES=1`.

The unknown email is simulated with suppressed delivery, but the claim link, signing
authority, publication, claim binding, and refresh are all real. The direct
`demo refresh` (without `--inbox`) is unchanged.

### Interactive REPL

```bash
npx @learncard/cli

# Optionally specify a seed
npx @learncard/cli 1b498556081a298261313657c32d5d0a9ce8285dc4d659e6787392207e4a7ac2
```

## Holder continuity export

The CLI exposes REPL helpers from `@learncard/holder-continuity` for holder-controlled export, restore, and self-import:

```js
const password = await getLearnCardBundlePassword();

await exportLearnCardBundle(learnCard, {
    out: './learncard-export.zip',
    password,
});

const freshWallet = await initLearnCard({ seed: '0'.repeat(64), network: true });
await importLearnCardBundle('./learncard-export.zip', {
    password,
    wallet: freshWallet,
    verifyBeforeImport: true,
});
```

```js
const restoredWallet = await restoreLearnCardFromBundle('./learncard-export.zip', { password });
```

`getLearnCardBundlePassword()` prompts without echoing the password into the REPL, which avoids saving it in REPL history. You can still pass a password string directly for local scripts.

`restoreLearnCardFromBundle(...)` decrypts the exported seed and returns a wallet with the original DID. It does not upload bundle payloads or recreate index records; use `importLearnCardBundle(...)` when copying credentials into another wallet.

If you omit the first argument, the CLI exports the default `learnCard` wallet it created at startup:

```js
const password = await getLearnCardBundlePassword();
await exportLearnCardBundle({ out: './learncard-export.zip', password });
```

See `@learncard/holder-continuity` `BUNDLE_SPEC.md` for the ZIP layout and manifest hashing rules.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Who is Learning Economy Foundation?

**[Learning Economy Foundation (LEF)](https://www.learningeconomy.io)** is a 501(c)(3) non-profit organization leveraging global standards and web3 protocols to bring quality skills and equal opportunity to every human on earth, and address the persistent inequities that exist around the globe in education and employment. We help you build the future of education and work with:

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
