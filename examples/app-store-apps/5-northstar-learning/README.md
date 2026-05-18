# Northstar Learning

A fictional AWS Cloud Practitioner prep platform built to demo the LearnCard **pathways reactor** end-to-end. Three products under one brand (Course, Practice Exams, AI Coach) — each page issues a differently-shaped verifiable credential, and each shape is picked up by a different **requirement matcher** on the seeded demo pathway.

## What it demonstrates

The pathway at `apps/learn-card-app/src/pages/pathways/dev/devSeed.ts :: buildAwsCloudPractitionerDemo` has seven nodes. Three of them point at Northstar listings and use `requirement-satisfied` terminations, each with a different matcher kind:

| Northstar page | VC type                            | Pathway node | Matcher kind                | What the matcher reads                                                   |
| -------------- | ---------------------------------- | ------------ | --------------------------- | ------------------------------------------------------------------------ |
| `/course`      | `AWSCloudEssentialsCompletion`     | Node 1       | `credential-type`           | VC `type` array contains the expected string                             |
| `/practice`    | `AWSPracticeExamScore`             | Node 2       | `score-threshold`           | `credentialSubject.practiceScore` is a number and `>= 80`                |
| `/coaching`    | `OpenBadgeCredential` (OBv3-shape) | Node 3       | `ob-achievement`            | `credentialSubject.achievement.id` equals the configured URL             |

The remaining four pathway nodes (IAM tutor, VPC tutor, Pearson scheduling, terminal credential) already demo `session-completed`, `self-attest`, `artifact-count`, and `any-of [boost-uri, credential-type]` respectively. **Six of the eight matcher kinds in the LearnCard matcher registry get a live end-to-end demo in one pathway.**

## The walkthrough (≈ 3 minutes)

1. In the main LearnCard app, open the debug panel → **Pathways** tab.
2. **Reset all** → clears any pre-existing pathway / proposal state.
3. **Seed AWS demo pathway** → plants the 7-node pathway in the store.
4. Open the Map tab, confirm the first three nodes show the **Northstar** brand in their app-listing cards.
5. Click the first node → opens Northstar `/course` via the app-listing launcher.
6. Inside Northstar, tick all four chapters, hit **Mark course complete**.
7. Pop back to the pathway — node 1 is now `Done`, node 2 (`Practice exams`) becomes `Up next`.
8. Repeat for `/practice` (take all 5 exams, hit Submit) and `/coaching` (click Next through the drill, hit Finish).
9. Nodes 4–6 exercise the remaining matcher kinds via the debug panel’s `Finish IAM tutor session` button and the external-URL Pearson step.
10. Arrive at the terminal credential node; the terminal-tier CTA modal fires.

## Local dev setup

```bash
# From the monorepo root
cp examples/app-store-apps/5-northstar-learning/.env.example \
   examples/app-store-apps/5-northstar-learning/.env

# Generate a deterministic issuer seed (hex-encoded, 32 bytes)
openssl rand -hex 32
# Paste the output as LEARNCARD_ISSUER_SEED in the .env file

pnpm install
pnpm nx dev @learncard/app-store-demo-northstar-learning
```

By default the Astro dev server runs on `http://localhost:4321`. The LearnCard app-listing launcher references this URL through the brain-service preset seed (`services/learn-card-network/brain-service/scripts/seed-dev-app.ts`). If you change the port, update that file and re-run `pnpm nx seed brain-service` (or your equivalent) so the in-app listings point at the right place.

## Architecture in one paragraph

The app is a standard Astro server build with the Netlify adapter. Each page's Astro frontmatter is server-rendered; per-page `<script>` blocks import `@learncard/partner-connect` (for `requestIdentity` / `sendCredential`) and `astro:actions` (to call the signing actions in `src/actions/index.ts`). The actions use `@learncard/init` with a deterministic seed to construct Northstar's issuer identity and `issueCredential()` to sign the VCs. The signed VC is returned to the page, which passes it to `sendCredential(vc)` — the SDK's raw-VC path — and the host wallet ingests it. No LearnCard Network storage is touched; no boost templates are created. For a production partner integration you'd layer in boost templates, but for the pathway-matcher demo the raw-VC path is the cleanest possible exercise.

## Design language

Vanilla CSS in `src/styles/main.css`. Northstar's palette is:

- **Deep navy** (`--brand-900: #0F1F3D`) for brand anchors, primary buttons, hero surfaces.
- **Emerald** (`--emerald-500` / `600` / `700`) for success / progress / issuance affordances.
- **Grayscale** (`--ink-50` … `--ink-900`) for text, borders, neutral surfaces.
- **Inter** font across the board; `rounded-[20px]` pills on buttons; `rounded-[28px]` on cards.

The palette intentionally rhymes with the host LearnCard app (same emerald-for-success convention, same rounded corners) so the demo feels continuous across the partner boundary.

## Related files outside this directory

- `apps/learn-card-app/src/pages/pathways/dev/devSeed.ts` — the pathway itself. The `buildAwsCloudPractitionerDemo` function is the source of truth for termination shapes.
- `apps/learn-card-app/src/pages/pathways/core/nodeRequirementMatcher.ts` — the matchers the VCs above satisfy.
- `apps/learn-card-app/src/pages/pathways/core/credentialIdentity.ts` — extracts the structural fingerprint from incoming VCs that the matchers read.
- `services/learn-card-network/brain-service/scripts/seed-dev-app.ts` — brain-service listing seed. Owns the launch URLs the app-listing cards route to.
- `apps/learn-card-app/src/pages/pathways/dev/presetListings.ts` — shared slug constants (must stay in lockstep with the brain-service seed).
