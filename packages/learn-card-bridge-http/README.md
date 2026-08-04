[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/http-bridge

[![npm version](https://img.shields.io/npm/v/@learncard/http-bridge)](https://www.npmjs.com/package/@learncard/http-bridge)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/http-bridge)](https://www.npmjs.com/package/@learncard/http-bridge)
[![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@learncard/http-bridge)](https://www.npmjs.com/package/@learncard/http-bridge)

**LearnCard Bridge - HTTP** is a suite of tools with a simple CLI for deploying a serverless execution environment for LearnCard Core exposed over an HTTP API.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

-   Clone this repo
-   Set up AWS CLI
-   Add a .env file exporting a wallet seed (e.g. `WALLET_SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`)
-   Run `bun run serverless-deploy`

## Local VC-API conformance testing

The bridge uses a source-controlled DIDKit WASM copied from the current plugin build. Every
build and start command verifies the canonical plugin artifact's SHA-256 before refreshing the
bridge copy, so local, CLI, and serverless execution cannot silently use different binaries.

```bash
cd lib/didkit/lib/web
wasm-pack build --target=web && cd pkg && wasm-opt -Oz -o tmp.wasm didkit_wasm_bg.wasm && mv tmp.wasm didkit_wasm_bg.wasm && cp didkit* ../../../../../packages/plugins/didkit/src/didkit/pkg/ && cd ..
bun --cwd ../../../../packages/plugins/didkit run build
```

Stop and restart any running bridge after rebuilding; it loads the DIDKit WASM during
initialization.
When intentionally rebuilding DIDKit, review the new binary and update
`EXPECTED_DIDKIT_SHA256` in `scripts/sync-didkit.ts`. To test an unreviewed local artifact
without changing that pin, set `LOCAL_DIDKIT_PATH` as described below.

Start the LearnCard HTTP bridge in the first terminal:

```bash
cd packages/learn-card-bridge-http
WALLET_SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
bun run start:local
```

Set `LOCAL_DIDKIT_PATH=/absolute/path/to/didkit_wasm_bg.wasm` only to override the
package-provided WASM. The test seed must match the issuer DID in `w3c-localConfig.cjs`.

Run the current W3C EdDSA Data Integrity suite in a second terminal:

```bash
git clone --depth 1 https://github.com/w3c/vc-di-eddsa-test-suite.git
cd vc-di-eddsa-test-suite
npm install
cp "$LEARN_CARD_REPO/packages/learn-card-bridge-http/w3c-localConfig.cjs" localConfig.cjs
npx mocha tests/05-di-rdfc-create.js --timeout 30000
npx mocha tests/15-di-rdfc-verify.js --timeout 30000
```

Set `LEARN_CARD_REPO` to the absolute path of this monorepo. Set `BASE_URL` when the
bridge is not listening at `http://127.0.0.1:3100`.

## URL issuer verification policy

When a credential names an HTTPS issuer, `checks: ["proof"]` establishes signature integrity but
does not establish that the named issuer authorized the proof's key. The raw result therefore
includes this security-relevant warning:

```text
Issuer authorization was not checked because the credential issuer is not a DID
```

Request `checks: ["proof", "issuerAuthorization"]` to require DIDKit to resolve the issuer's
controlled identifier document and confirm that its `assertionMethod` authorizes the proof's
verification method. The check fails closed if the document is unavailable or does not authorize
the key. Remote issuer resolution requires a LearnCard initialized with `allowRemoteContexts:
true`; otherwise only statically supplied documents can satisfy the check.

Consumers must not interpret `checks: ["proof"]` by itself as issuer authorization.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Who is Learning Economy Foundation?

**[Learning Economy Foundation (LEF)](https://www.learningeconomy.io)** is a 501(c)(3) non-profit organization leveraging global standards and web3 protocols to bring quality skills and equal opportunity to every human on earth, and address the persistent inequities that exist around the globe in education and employment. We help you build the future of education and work with:

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
