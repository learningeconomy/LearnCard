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
npx @learncard/cli send
```

Prompts for a recipient if omitted (or pass it: `send you@yourdomain.com`), generates a seed into `.env`, creates your issuer profile, sends a "Quickstart Complete" badge, and writes the code it ran to `./send.mjs`. The recipient can be an email or phone number (delivered through the Universal Inbox with a claim link) or an existing profile ID or DID (delivered straight into their wallet). Placeholder addresses like `you@example.com` are rejected — nobody would receive the badge. Pass `--yes` to accept defaults (the recipient must then be given as an argument); `--name "Acme"`, `--badge "Welcome to Acme"`, `--description`, and `--profile-id` set them explicitly. Walkthrough: https://docs.learncard.com/start-here/your-first-integration

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

## Bootstrap an organization

```bash
npx @learncard/cli org apply ./org.yaml
```

Reconciles a declarative YAML/JSON spec (issuer profile, signing authority, districts/managed profiles, service-account tokens) against the network. Idempotent — re-running with the same file makes no changes. Use `--dry-run` to preview, and `--secrets-out ./secrets.env` to save any newly created service-account tokens (required the first time a `serviceAccounts` entry is created; each is written as `NAME=token` with the account name upper-cased and hyphens replaced by underscores, e.g. `EA_CLR_ISSUER=…`). `branding` (on the issuer and on each managed profile) sets the profile image, hero image, bios, website, type, and wallet display colours; it is diffed field-by-field, so re-running only sends what changed and `display` colours are merged, never wiped. Images must be https URLs for now — host them and paste the link. Webhooks are not registered on the network — LearnCard calls `configuration.webhookUrl` per issuance — so the first `webhooks[].url` is saved as `WEBHOOK_URL` in `.env` for `doctor` and your issuer code to default to. Start from one of `examples/*.network.yaml` — `minimal`, `service-account`, `branded`, `self-hosted-signing`, `state-districts`, or `delegated-service-account` — each shows one idea.

```yaml
issuer:
    profileId: scde
    displayName: South Carolina Department of Education
    branding:
        image: https://cdn.example.org/scde-logo.png
        shortBio: State education agency.
        websiteLink: https://ed.sc.gov
        display: { backgroundColor: '#18224E', accentColor: '#2E7D32' }
    signingAuthority: { type: learncard-hosted, name: scde-clr }
profileManager:
    displayName: SC Districts
    managed:
        - { profileId: sc-greenville, displayName: Greenville County Schools }
serviceAccounts:
    - name: ea-clr-issuer
      scopes: [inbox:write, inbox:read, credentials:write, credentials:read]
```

A service account's `actAs` controls whether its token can act as a managed profile: `'*'` allows any profile under `profileManager.managed`, or list specific profile IDs (e.g. `actAs: [sc-greenville, sc-north]`) to limit it to those. Omit `actAs` and the token cannot act as anyone — delegation is deny-by-default, so add it explicitly wherever a backend needs to issue on a district's behalf. See `examples/delegated-service-account.network.yaml`.

Once the org exists, `send` picks up its pieces automatically: with a signing authority registered it signs through that authority by default (`--no-template` opts back out to the local key), and `--as <managedProfileId>` sends as one of the managed profiles — signed with that profile's own did:web, no separate seed or folder needed. `inbox list --as <managedProfileId>` shows what that profile has sent. `LEARNCARD_AS=<profileId>` does the same for a whole shell session without persisting anything, and `whoami` shows the folder's identity plus every profile `--as` can target (plus any service accounts and what they may act as). A folder is one identity; passing a different `--profile-id` is an error that points you at `--as`. Backends using an API token act as a managed profile by sending the `X-LearnCard-Act-As` header (SDK: `initLearnCard({ apiKey, actAs })`) — allowed only if the token's `actAs` permits it.

## Preflight with doctor

```bash
npx @learncard/cli doctor
```

Checks this project's issuer setup against the network — identity, network reachability, API token scopes, signing authority (with a real test-sign + verify), did:web resolution, an optional `--webhook-url` ping, and whether managed credential refresh is enabled — printing one line per check with a remediation command for anything that fails. Nothing is sent, allocated, or written to the network. Pass `--strict` to also exit non-zero on warnings, or `--scopes "..."` to check different permissions than the default Universal Inbox set.

## Promote staging → production

```bash
npx @learncard/cli promote --from staging --to production --org ./org.yaml
```

Re-applies your org spec in its own `.learncard/production` folder (each network needs its own `.env`), writes fresh service-account tokens to `<target>/secrets.env` (or `--secrets-out`), and runs `doctor` — then prints the per-network checklist (profile, tokens, signing authority, templates, ConsentFlow contracts, credentials) that doesn't carry over; only your seed's `did:key` does. Add `--dry-run` to preview or `--skip-doctor` to skip the preflight.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Who is Learning Economy Foundation?

**[Learning Economy Foundation (LEF)](https://www.learningeconomy.io)** is a 501(c)(3) non-profit organization leveraging global standards and web3 protocols to bring quality skills and equal opportunity to every human on earth, and address the persistent inequities that exist around the globe in education and employment. We help you build the future of education and work with:

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
