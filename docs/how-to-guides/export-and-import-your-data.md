---
description: 'How-To Guide: Export, restore, and import all of your LearnCard data'
---

# Export & Import Your Data

This guide is a step-by-step recipe for taking **all of your LearnCard data** with you: your keys, credentials, presentations, consent records, and more. You can save it as a single encrypted file, restore your original account from it, or copy its contents into a brand-new account.

{% hint style="success" %}
**Our commitment to holder continuity**

Your data is yours. LearnCard is built so that you can always export everything that defines your identity and move it elsewhere — **without asking us for permission and without our servers needing to cooperate.** The export is a normal ZIP file built on open standards (W3C Verifiable Credentials, DIDs, JSON), so it stays useful for verification and migration even if LearnCard services are unavailable. Read the full commitment in [Holder Continuity](../core-concepts/holder-continuity.md).
{% endhint %}

---

## What's in the export

An export ("bundle") is a single password-protected ZIP file containing:

-   Your **key material** (private-key seed, recovery phrase, and JWKs) — encrypted
-   Your **DID** and DID document
-   All of your **Verifiable Credentials and Presentations** — exactly as issued, with signatures preserved
-   Your **wallet index** records (so credentials keep their titles and categories)
-   Your **consent records** and transaction history
-   **Status-list snapshots** for credential revocation state at export time
-   A readable `manifest.json` listing every file and its SHA-256 hash

Everything sensitive is encrypted per-file using **Argon2id + AES-256-GCM**. The `manifest.json` itself stays readable so you can inspect the contents without the password.

{% hint style="warning" %}
**Treat your export like a password-vault backup.** It contains your full private key (encrypted). Anyone who has both the file **and** its password can take full control of your account, so store it offline, use a strong unique password, and rotate your account if the file is ever exposed.
{% endhint %}

### Prerequisites

-   An initialized LearnCard wallet (`@learncard/init`)
-   The `@learncard/holder-continuity` package installed:

```bash
pnpm add @learncard/holder-continuity
```

---

## 1. Export your data

This is the most common task: save everything to an encrypted file.

{% tabs %}
{% tab title="SDK" %}

```typescript
import { exportLearnCardBundle } from '@learncard/holder-continuity';

await exportLearnCardBundle(learnCard, {
    out: './learncard-export.zip',
    password: 'use-a-strong-password',
});
```

{% endtab %}

{% tab title="CLI" %}

```js
// The LearnCard CLI prompts for the password without echoing it,
// so it never lands in your shell history.
const password = await getLearnCardBundlePassword();

await exportLearnCardBundle(learnCard, {
    out: './learncard-export.zip',
    password,
});
```

{% hint style="info" %}
If you omit the wallet, the CLI exports the default `learnCard` wallet it created at startup: `await exportLearnCardBundle({ out: './learncard-export.zip', password })`.
{% endhint %}
{% endtab %}
{% endtabs %}

That's it — you now have a portable, encrypted copy of your account at `./learncard-export.zip`.

---

## 2. Inspect an export (optional)

You can read a bundle back to confirm what it contains. The decrypted entries are plain W3C JSON.

```typescript
import { readLearnCardBundle } from '@learncard/holder-continuity';

const bundle = await readLearnCardBundle('./learncard-export.zip', {
    password: 'use-a-strong-password',
});

console.log(bundle.manifest.primaryDid); // your DID
console.log(bundle.entries.length); // number of items exported
console.log(bundle.warnings); // anything skipped during export
```

---

## 3. Restore your original account

Use **restore** when you want your **original identity back** — same key, same DID. This decrypts the exported seed and rebuilds the wallet.

```typescript
import { restoreLearnCardFromBundle } from '@learncard/holder-continuity';

const restored = await restoreLearnCardFromBundle('./learncard-export.zip', {
    password: 'use-a-strong-password',
    init: { network: true },
});

console.log(restored.id.did()); // identical to the original wallet's DID
```

{% hint style="info" %}
Restore recreates your **identity**. It does not re-upload your credentials or rebuild your index — for that, use **import** (next step). Use restore when you want to get back into your original account; use import when you want to copy credentials into a different account.
{% endhint %}

---

## 4. Import into another account

Use **import** when you want to copy your credentials and presentations into a **different, fresh wallet**. Import uploads each credential to the target wallet's storage and recreates its index records.

```typescript
import { initLearnCard } from '@learncard/init';
import { importLearnCardBundle } from '@learncard/holder-continuity';

const freshWallet = await initLearnCard({ seed: '0'.repeat(64), network: true });

const report = await importLearnCardBundle('./learncard-export.zip', {
    password: 'use-a-strong-password',
    wallet: freshWallet,
    verifyBeforeImport: true,
});

console.log(report.importedCredentials); // how many credentials were copied
console.log(report.importedPresentations); // how many presentations were copied
console.log(report.errors); // any entries that failed
```

{% hint style="warning" %}
**Verify what you import.** Set `verifyBeforeImport: true` to check each credential's and presentation's signatures before they are uploaded. Without it, import only proves the file decrypted correctly — not that the credentials are genuinely signed. **Only import bundles from sources you trust.**
{% endhint %}

---

## When to use which

| Your goal                                  | Use                          |
| ------------------------------------------ | ---------------------------- |
| Save a backup of everything                | `exportLearnCardBundle`      |
| See what's inside a backup                 | `readLearnCardBundle`        |
| Get my **original account** back           | `restoreLearnCardFromBundle` |
| Copy my credentials into a **new account** | `importLearnCardBundle`      |

---

## Related

{% content-ref url="../core-concepts/holder-continuity.md" %}
[holder-continuity.md](../core-concepts/holder-continuity.md)
{% endcontent-ref %}

{% content-ref url="../sdks/learncard-cli.md" %}
[learncard-cli.md](../sdks/learncard-cli.md)
{% endcontent-ref %}
