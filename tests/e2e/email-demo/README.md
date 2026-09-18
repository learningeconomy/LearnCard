# Manual Universal Inbox email demo

This mode sends real transactional emails through your configured Postmark account.
Use an email address you control. Open the links on the computer running the local
app: `localhost` in an email on your phone points to your phone, not your computer.

The walkthrough is visible from end to end:

1. Enter your email in the CLI. The demo school sends a provisional certificate.
2. Open the email and choose **Claim Your Record**. Sign in or create an account
   with that same email, then claim the provisional certificate. Sign out of any
   disposable demo account before opening the email link.
3. Return to the CLI and press Enter to let the school publish final results.
4. View the update notification in the app. An update email also links back to
   your notifications; sign in again if necessary.
5. Open the updated certificate to see final results in the same saved record.

Publishing before an account exists is also supported: the latest version is
issued when the recipient claims. It is tested separately and demonstrated by the
original disposable-account mode, rather than adding an invisible step here.

## Enable email locally

Start the normal local services first. In this directory create `.env.local`
(ignored by Git, keep it private) containing the following existing development
credentials:

```dotenv
POSTMARK_API_KEY=your-brain-service-postmark-key
BRAIN_POSTMARK_FROM_EMAIL=support@your-verified-domain.example
POSTMARK_SERVER_TOKEN=your-lca-postmark-key
POSTMARK_FROM_EMAIL=your-verified-domain.example
POSTMARK_BRAND_NAME=LearnCard
GOOGLE_APPLICATION_CREDENTIAL='{"project_id":"your-frontend-firebase-project", "...":"..."}'
```

Use the full Firebase service-account JSON matching the frontend's tenant config.
The LCA sender setting is a **domain**, while the brain sender setting is a full
email address. The Postmark server must support the `universal-inbox` message
stream. Tenant email branding may override the configured sender domain.

From the repository root:

```bash
docker compose -p e2e --env-file tests/e2e/email-demo/.env.local \
  -f tests/e2e/compose.yaml -f tests/e2e/compose.email-demo.yaml \
  up -d --no-deps brain lca-api
```

This recreates only the application containers and preserves the existing data.
It mounts the local email templates and LCA source. Run the frontend on port 3000,
with tenant config pointing to brain 4000, cloud 4100, and LCA 5200.

```bash
bun --cwd packages/learn-card-cli start demo refresh --inbox --ui --email
```

You can also supply the address with `--email you@example.com`. The CLI uses the
issuer's view to check the claim; it cannot read your personal saved credentials.
Inspect the before/after certificate in the app yourself.

The default E2E Compose file deliberately logs emails. Adding a Postmark key to
that stack alone does **not** enable delivery. This override disables the E2E
adapter for brain and LCA; **never use it for automated tests**.

Restore logging-only behavior afterward:

```bash
docker compose -p e2e -f tests/e2e/compose.yaml up -d --no-deps brain lca-api
```

If no email arrives, check Postmark activity and the brain/LCA logs for a rejected
sender or missing message stream. A successful issuance means the credential was
created; it does not prove the message reached your mailbox.
