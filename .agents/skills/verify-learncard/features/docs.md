# Docs quickstart

The docs promise that `docs/quick-start/your-first-integration.md`'s code sends a real credential. The journey proves the page embeds exactly the snippet files, runs `send.mjs` against the local network, and checks that the recipient really received "Quickstart Complete".

## Sub-features

- `docs-snippets-in-sync`: `node scripts/check-docs-snippets.mjs` → `all in sync`.
- `docs-quickstart-send`: `docs/snippets/quickstart/send.mjs` with both Brain and LearnCloud pinned to this directory's endpoints exits 0 and prints `Delivered.` plus a reusable template URI on the allocated local Brain.
- `docs-quickstart-received`: the recipient wallet's incoming credentials include "Quickstart Complete".

## How to get to it (user POV)

- docs.learncard.com → Start here → Your first integration; copy `send.mjs`; `node --env-file=.env send.mjs <recipient>`.

## Driving it with lc verify

Preconditions:

- Doctor ok.

- **Run.** `$LCV run docs --dir /tmp/lcv` → passed; `NNN-docs-quickstart-run.json` holds stdout and stderr.
- **Other snippets.** Run them the same way from a script: copy into `apps/learn-card-app/scripts/verification/.scratch/` (gitignored, so `@learncard/init` resolves), explicitly pin **both** `network: v.stack.brain` and `cloud: { url: v.stack.cloud }`, and run with `--conditions=development`. Rewriting only `network: true` leaves the default production LearnCloud reachable outside browser routing. ConsentFlow snippets are already exercised by [consent-flow](consent-flow.md).

## Gotchas

- An email recipient produces `Sent. … claim email` (Universal Inbox) and needs mail delivery; a profile-ID recipient produces `Delivered.`.
- `tests/e2e/tests/docs-*.spec.ts` covers more snippets against the e2e compose stack (port 5200 for LCA); don't point that suite at this stack, because it uses fixed seeds and profile IDs.
- After editing a snippet file, run `node scripts/check-docs-snippets.mjs --fix` to update the Markdown.
