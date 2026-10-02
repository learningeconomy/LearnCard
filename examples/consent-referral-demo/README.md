# Partner Connect local demo

An interactive three-account example inspired by the Hire Heroes USA / VetPass product brief. Hire Heroes USA refers Alex Morgan to Hiring Our Heroes. Actions call the checkout's real local consent APIs. Salesforce remains an external client of the API/webhooks, shown for context only.

With workspace dependencies installed and OrbStack/Docker running, from the repository root:

```sh
bun --conditions=development examples/consent-referral-demo/start.ts
```

Open **http://localhost:8812** and choose **Set up demo**. The launcher starts small Bun containers and synthetic databases; it does not build a monorepo Docker image. Ports 4000, 4100, 5200, 8812 and 8813 must be available. Ctrl+C stops the UI and the service containers and removes its disposable database volumes. Existing unrelated containers are untouched.

If the three local test APIs are already running, add `--services-running`. To reuse an existing **synthetic test** database stack with service DNS names `neo4j`, `mongodb`, `redis`, `redis2`, `redis3` and `elasticmq`, add `--db-network <network-name>`. The launcher only starts its own API containers in that mode.

## Try the flow

1. Set up creates three synthetic profiles and a partner-owned contract naming the referrer as a recipient. No consent is recorded yet.
2. In **Hire Heroes USA**, choose **Send referral**.
3. In **Veteran**, use **View Details** or **Accept & Connect**, choose data permissions, then **Confirm & Connect**. The live organization snapshots should include selected fields only.
4. In **Hiring Our Heroes**, choose **Record enrollment outcome**. It arrives pending for Alex; it is not yet shared data.
5. In **Veteran**, claim the outcome. If sharing is selected, the demo stores a personal encrypted copy, encrypts a sharing copy for the fresh audience and calls the sync API. Both organization snapshots should show a decryptable outcome and a signed correlated update.
6. Stop sharing; both data reads should return no consented records. Previously received copies cannot be recalled.

Use **Fresh scenario** for decline, dismissal/recovery, recipient removal or cancellation during review. It creates a new contract; terminal requests are not reused. Test cancellation from the expandable section inside the learner's review, then try confirming that already-open review: the backend should reject it.

The UI listens on loopback only. Its API actions require a same-origin token. A separate receiver listens on all interfaces so containerized services can send their signed webhooks via `host.docker.internal`; it accepts only verified service notifications for the synthetic demo profiles. Seeds and API tokens stay in the server process. Reopening the page preserves the current in-memory session; restarting the server requires fresh setup. Fresh scenarios leave earlier synthetic history in the current databases. The default stack is discarded on shutdown; reused test databases retain their history.

This is a test interface, not the actual VetPass React screens. Claim-to-sync is explicit here. Production app alerts, guardian approval, automatic React synchronization and rollout gates still need separate app QA. The demo shares only the selected synthetic outcome; it does not establish credential-origin filtering for category `shareAll`.

For direct consent links, app redirects and credential sending, use the existing [consent-flow-test](../consent-flow-test/README.md) example. This demo complements it rather than replacing it.

## Validate changes to this example

Start the demo (or the three synthetic local test APIs), then run from the repository root:

```sh
bun --conditions=development test examples/consent-referral-demo/integration.test.ts
bun run --cwd examples/consent-referral-demo typecheck
```

The integration tests use a separate in-memory demo on ports 8920/8921 and leave the interactive session alone. They check selected fields, outcome issuance and decryption, signed update correlation, permission narrowing, withdrawal, recipient removal, dismissal recovery, denial, cancellation during review, and local action protection. They create synthetic history in the local databases.
