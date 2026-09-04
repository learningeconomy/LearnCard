# LearnCard App

The **LearnCard App** is a digital wallet for verifiable credentials. It allows users to claim, store, organize, and share their achievements, badges, certifications, and IDs.

Available on:

- 📱 iOS ([App Store](https://apps.apple.com/us/app/learncard/id1635841898))
- 📱 Android ([Google Play](https://play.google.com/store/apps/details?id=com.learncard.app))
- 🌐 Web ([app.learncard.com](https://app.learncard.com))

---

## Key Features

| Feature               | Description                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| **Claim Credentials** | Scan QR codes or click links to add credentials to your wallet         |
| **Organize**          | Categorize credentials by type (achievements, IDs, work history, etc.) |
| **Share**             | Generate shareable links or presentations for verifiers                |
| **Connect**           | Find and connect with other profiles on the LearnCard Network          |
| **Consent**           | Control what data you share and with whom                              |

---

## User Flows

### Claiming a Credential

```mermaid
flowchart LR
    A[User receives link/QR] --> B[Opens in LearnCard App]
    B --> C{Logged in?}
    C -->|No| D[Create account / Login]
    C -->|Yes| E[Review credential]
    D --> E
    E --> F[Accept & Save]
    F --> G[Credential in wallet]
```

1. User receives a claim link or scans a QR code
2. Link opens the LearnCard App
3. User logs in (or creates an account)
4. User reviews the credential details
5. User accepts and saves to their wallet

### Sharing a Credential

```mermaid
flowchart LR
    A[Select credential] --> B[Tap Share]
    B --> C[Choose method]
    C --> D[QR Code]
    C --> E[Link]
    C --> F[Presentation]
```

1. User selects a credential from their wallet
2. Taps "Share"
3. Chooses sharing method:
    - **QR Code** — For in-person verification
    - **Link** — For sending digitally
    - **Presentation** — For formal verification requests

### Self-Assigning Skills

```mermaid
flowchart LR
    A[Open Skills Hub] --> B[Tap + button]
    B --> C[Search or browse skills]
    C --> D[Select skills]
    D --> E[Set proficiency levels]
    E --> F[Save]
    F --> G[Skills in wallet]
```

1. User opens the Skills Hub from their wallet
2. Taps the **+** button to add skills
3. Searches by skill name or occupation, or browses suggested skills across the available frameworks
4. Selects one or more skills from a framework
5. Sets a proficiency level for each skill:
    - **Hidden** — Do not display proficiency status
    - **Novice** — Just starting and needs guidance
    - **Beginner** — Handles simple tasks without support
    - **Proficient** — Works independently on routine tasks
    - **Advanced** — Solves complex tasks efficiently
    - **Expert** — Deep mastery; can lead and mentor others
6. Saves the self-attested skills to their wallet

{% hint style="info" %}
Self-assigned skills are **self-attested credentials**. They represent what a user claims about their own abilities. For third-party verified skills, see issued credentials from organizations.
{% endhint %}

---

## Account Security & Recovery

Each account is controlled by a private key that never exists in one place: it is split into pieces held by the user's device, LearnCard's servers, and the user's recovery methods, and any two pieces are needed to sign in. Neither LearnCard nor a stolen phone alone can access the account.

After signing up, users are prompted to set up at least one recovery method:

| Method              | What it is                                                |
| ------------------- | --------------------------------------------------------- |
| **Passkey**         | Face ID, Touch ID, or a hardware key on the user's device |
| **Recovery Phrase** | A 24-word phrase the user writes down                     |
| **Backup File**     | A password-protected file the user downloads              |
| **Email Backup**    | An encrypted backup sent to a verified email address      |

Signing in on a new device works either by scanning a QR code from a device that's already signed in, or by using one of the recovery methods. Recovery settings live under **Account Recovery** in the profile.

For how this works under the hood, see [Key Management (SSS)](../../core-concepts/identities-and-keys/key-management-sss.md), [Account Recovery](../../core-concepts/identities-and-keys/account-recovery.md), and [Cross-Device Login](../../core-concepts/identities-and-keys/cross-device-login.md).

---

## Related Documentation

- [Export & Import Your Data](../../how-to-guides/export-and-import-your-data.md) — Take your data with you
- [Send & Issue Credentials](../../how-to-guides/send-credentials.md) — For organizations issuing into the app
- [Publish Your App in LearnCard](../../how-to-guides/publish-your-app.md) — Build an experience inside the app
- [Verify Credentials](../../tutorials/verify-credentials.md) — For verifiers
- [ConsentFlow Overview](../../core-concepts/consent-and-permissions/consentflow-overview.md) — How users control what they share
