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
