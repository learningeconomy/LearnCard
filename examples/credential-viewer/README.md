# Credential Library Viewer

An interactive React + Tailwind UI for browsing, issuing, and sending credentials from the `@learncard/credential-library` fixture library.

## Running

```bash
bun run dev
```

This starts a Vite dev server (typically at `http://localhost:5173`).

The dev server reads credential-library source directly, so new fixtures appear without rebuilding the package.

## Features

### Browse & Filter

- **Search** — Full-text search across fixture ID, name, description, tags, and features
- **Filter chips** — Filter by spec (VC v1, v2, OBv3, CLR, Boost), profile, validity, and inferred category
- **Stats bar** — Real-time counts of valid/invalid/total fixtures

### Inspect Fixtures

- **Fixture cards** — Color-coded by spec with validity badges
- **Detail panel** — Full JSON viewer with syntax highlighting, metadata summary, and inferred category

### Wallet Connection

- **Seed-based** — Generate a random seed or enter your own
- **Network environments** — Production, Staging, Local, or Custom (configurable network + cloud URLs)
- **Persisted** — Seed and environment are saved to localStorage

### Bulk Issue

1. Select fixtures using checkboxes (or "Select All Valid")
2. Click **Issue** in the bulk action bar
3. Each fixture is prepared with your wallet's DID via `prepareFixture`, issued, and stored to LearnCloud with auto-categorization

### Bulk Send

1. Select fixtures and click **Send**
2. Enter a recipient profileId
3. Each fixture is prepared, issued, and sent via the LearnCard network using its detected category

### Create New Fixtures

The **New Fixture** button opens a form with:

- **Folder + filename** selection (or create a new folder)
- **Metadata fields** — Name, description, spec, profile, source, validity, features, tags
- **JSON editor** — Edit the credential JSON directly, or upload a `.json` file
- **Auto-inference** — Metadata fields are auto-populated based on the credential JSON content
- **Test Issue** — Verify the credential can be issued before saving (requires wallet connection)
- **Save to Disk** — Writes the `.ts` fixture file and updates `src/fixtures/index.ts` automatically

> Fixture creation uses a Vite dev server plugin (`src/vite-plugin-fixtures.ts`) and is only available during development.

### Testing Qualifications (LC-2111)

From the monorepo root:

```bash
bun run --cwd examples/credential-viewer dev
```

1. Open the printed viewer URL. Select **Local** when testing the local LearnCard app; the recipient and viewer must use the same network.
2. Click **Generate Wallet**, create an LCN profile if prompted, then click **Set Up Signing Authority**. The Local preset expects brain-service on port 4000, LearnCloud on 4100, and LCA API on 5100.
3. Search **`lc-2111`** and click **Select All Valid**. This selects seven Qualifications fixtures: License, Certification, ApprenticeshipCertificate, JourneymanCertificate, MasterCertificate, an expired Certification, and a Certification with an explicit badge layout.
4. Click **Send All**, enter your LearnCard app account's profile ID, enable **Keep fixture dates (including expired credentials)**, and send. Without that option, preparation refreshes the expired fixture's dates.
5. In LearnCard, accept the incoming credentials and open **Passport → Qualifications**.

Check that all seven appear in Qualifications. The five ordinary credentials and expired credential should use the certificate layout; **Safety Certification — Badge Layout** should retain its explicit badge layout. Check the expired credential's indicator, detail view, and selection in sharing flows.

For issuer-only checks, **Issue All to Self** signs and stores credentials in the viewer's connected account. It does **not** send them to your separately signed-in LearnCard app account.

### Managed Transcript Refresh Demo

Connect a network account with a profile, then open **Managed Refresh Demo**. The demo
self-issues and accepts the provisional CLR fixture before allowing you to publish the
final transcript with the same credential ID. It displays only safe lifecycle metadata:
refresh ID, managed version, dates, and notification outcome.

### CLR Verification Demo (Local and Staging)

This sends five genuinely signed transcripts to a normal LearnCard test account.
The publisher and two fictional district issuers have network-hosted `did:web`
identities. Revocation and suspension use the selected network's signed status
lists, not a temporary fixture server. You can close the viewer after sending;
the examples remain verifiable until that network's test data is reset.
The supporting courses use managed delivery receipts; the sender checks the
published status result before reporting a successful batch.

```bash
bun run --cwd examples/credential-viewer dev
```

1. Keep your local LearnCard stack running for **Local**, or use a test account on
   **Staging**. Open the viewer URL printed by Vite.
2. Select **Local** or **Staging** in the connection bar **before connecting**.
   Generate/connect a publisher account and create its profile if prompted.
   A signing authority is not required for this locally signed demo.
3. Open **CLR Verification Demo**, enter the recipient's profile ID/public handle
   on that same network, and select **Send verification demo**. Production is
   disabled; Custom is limited to loopback services for local verification.
4. Wait for all five named deliveries. Two supporting course credentials are also
   delivered to establish real revocation/suspension bindings; lifecycle
   notifications may appear. A failed batch lists any transcripts already sent.
   Check those before retrying: another attempt creates new issuers and examples.
5. In the recipient's normal LearnCard app, open **Alerts**, claim the demo
   transcripts, and open **Studies**. If asked to connect with the publisher,
   **Skip for Now** is sufficient. Each batch has a unique suffix:

    | Transcript            | Expected result                                                        |
    | --------------------- | ---------------------------------------------------------------------- |
    | All verified          | Verified publisher and all four signed record occurrences verified     |
    | Revoked record        | Verified publisher; one included record revoked                        |
    | Suspended record      | Verified publisher; one included record suspended                      |
    | Tampered signature    | Verified publisher; one included signature cannot be confirmed         |
    | Mixed signed/unsigned | Verified publisher; unsigned record has no alarming certification mark |

6. Expand the certifying issuer groups and open a record. Duplicate source IDs
   are separate occurrences. Fictional issuers need not be on a trusted registry:
   not-listed is separate from whether their signatures verify.
7. Open **Passport → Share → Share credentials**, select the demo transcripts,
   enter a title, select **Preview**, then **Create private link**. Open that
   link in a signed-out/private browser and reload. The same per-record results
   appear inline without signing in.

For an acceptance video, connect the publisher before recording, then show the
selected network, send results, normal claim/Studies flow, issuer details and
signed-out shared collection. Keep seeds, sign-in links and bearer share links
private; do not film developer tools or the connection secret.

## Architecture

| File                                          | Purpose                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| `src/App.tsx`                                 | Main layout — search, filters, fixture grid, detail panel                    |
| `src/context/WalletContext.tsx`               | Wallet lifecycle, issue+store, and send operations                           |
| `src/components/FilterBar.tsx`                | Multi-facet filter chips (spec, profile, validity, category)                 |
| `src/components/FixtureCard.tsx`              | Individual fixture card with checkbox and metadata badges                    |
| `src/components/DetailPanel.tsx`              | Slide-over panel with full JSON and metadata                                 |
| `src/components/IssuePanel.tsx`               | Bulk issue modal with progress tracking                                      |
| `src/components/SendPanel.tsx`                | Bulk send modal with recipient input and progress                            |
| `src/components/NewFixturePanel.tsx`          | Fixture creation form with JSON editor and auto-inference                    |
| `src/components/ManagedRefreshPanel.tsx`      | Provisional-to-final managed refresh issuer demo                             |
| `src/components/ClrVerificationDemoPanel.tsx` | Local/Staging acceptance-demo controls and delivery progress                 |
| `src/lib/clr-verification-demo.ts`            | Independent issuers, hosted lifecycle bindings and five signed demo variants |
| `src/components/ConnectBar.tsx`               | Wallet connection UI with seed input and environment selector                |
| `src/components/JsonViewer.tsx`               | Syntax-highlighted JSON display                                              |
| `src/components/BulkActionBar.tsx`            | Floating action bar for selected fixtures                                    |
| `src/lib/category.ts`                         | Credential categorization heuristics (Achievement, ID, Studies, etc.)        |
| `src/lib/colors.ts`                           | Spec/profile/category color mappings                                         |
| `src/lib/infer-metadata.ts`                   | Auto-infer fixture metadata from credential JSON                             |
| `src/vite-plugin-fixtures.ts`                 | Dev server middleware for reading/writing fixture files on disk              |

## Tech Stack

- **React 18** + TypeScript
- **Tailwind CSS** for styling
- **Vite** for dev server and bundling
- `@learncard/credential-library` for fixtures and preparation
- `@learncard/init` for wallet instantiation
- `@learncard/types` for VC types
