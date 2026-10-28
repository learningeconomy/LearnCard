# Credential share links

A learner opens a credential they earned, chooses **Share** → **Copy Link**, and an anonymous visitor opening that link sees the credential and its issuer, before and after a reload.

## Sub-features

- `share-menu-copy`: credential detail → **More options** → **Share** shows a QR code (`Share QR code`). **Copy Link** puts `https://<tenant host>/share-boost?uri=…&seed=…&pin=…` on the clipboard and shows it.
- `share-public-preview-isolation`: opting into a public preview changes only the exact private share record, not another credential's record.
- `share-deleted-preview-recovery`: delete a preview through the real SDK, reopen Share, and enable a replacement; the original presentation stays the same and its private index stores the new ID.
- `share-endorsed-preview-stability`: share an endorsed credential twice; each new presentation gets a distinct preview, and both earlier and newer public cards remain resolvable.
- `share-anonymous-view`: a fresh, signed-out browser opens the link and sees **Login**, the title, and the same `.issued-by` text, including after a reload.

## How to get to it (user POV)

- Passport → Badges → open a badge → **⋮ More options** → **Share** → **Copy Link**.
- Paste the link into any browser.

## Driving it with lc verify

Preconditions:

- Doctor ok. The owner context has `clipboard-read`/`clipboard-write` permissions (the journey grants them).

- **Run.** `$LCV run sharing --dir /tmp/lcv` → `sharing: passed`; observations record `linkFormat` and the issuer.
- **Earn something.** Self-issue a badge as in [credentials](credentials.md) and open its detail.
- **Copy.** `getByRole('dialog').getByRole('button', { name: 'More options' })` → **Share** → **Copy Link**. `navigator.clipboard.readText()` returns a URL whose host matches the allocated app host in `v.stack.app`, path `/share-boost`, with `uri`, `seed` and `pin` all present.
- **Opt in.** Before consent, **Post to LinkedIn** is disabled and has no outgoing link while **Copy Link** remains available. Choose **Enable Public Preview**, then wait for the enabled **Post to LinkedIn** link. Resolve its `preview` and matching `uri` through this stack's public API; check the title and confirm an unrelated private index row is unchanged. Reopening Share requires opting in again.
- **Recover a deleted preview.** Delete that owned preview with `wallet.invoke.deleteCredentialSharePreview(id)`, then reopen Share and opt in again. The old ID stays unavailable, the replacement resolves for the same presentation, and the exact private row holds the replacement ID.
- **Keep earlier posts working.** Seed a real signed public endorsement, share its credential twice through the UI, and resolve both preview/URI pairs after the second share. Both return metadata; substituting one presentation's URI into the other's lookup returns 404.
- **View anonymously.** A new context (no session) opens the same URL with `https:` → `http:`. **Login** is visible, plus the title and the matching issuer. Reload and the result is the same.

## Gotchas

- Links are always `https://`. The local stack has no TLS, so the viewer swaps only the scheme; host, path and query stay as copied. Record that substitution in any report.
- The link carries bearer secrets (`seed`, `pin`). The journey navigates away from the share screen before its automatic "after" screenshot. Never paste these links into PRs.
- Newer `/s/{id}#{key}` links (LC-2187) exist for other share surfaces. This journey covers the credential-detail share path, which still emits `/share-boost`.
- Preview metadata is publisher-supplied, not proof of presentation ownership. A new encrypted presentation needs a separate preview; refresh never rebinds an existing one.
