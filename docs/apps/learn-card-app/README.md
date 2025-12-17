# LearnCard App

The **LearnCard App** is a digital wallet for verifiable credentials. It allows users to claim, store, organize, and share their achievements, badges, certifications, and IDs.

Available on:
- 📱 iOS (App Store)
- 📱 Android (Google Play)
- 🌐 Web ([app.learncard.com](https://app.learncard.com))

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Claim Credentials** | Scan QR codes or click links to add credentials to your wallet |
| **Organize** | Categorize credentials by type (achievements, IDs, work history, etc.) |
| **Share** | Generate shareable links or presentations for verifiers |
| **Connect** | Find and connect with other profiles on the LearnCard Network |
| **Consent** | Control what data you share and with whom |

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

---

## Related Documentation

- [Create a Credential](../../tutorials/create-a-credential.md) — For issuers
- [Verify Credentials](../../tutorials/verify-credentials.md) — For verifiers
- [ConsentFlow Overview](../../core-concepts/consent-and-permissions/consentflow-overview.md) — Understanding consent
