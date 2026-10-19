---
name: ship-with-proof
description: Use when asked to be done, open a PR, ship, prove, fix bug, or build feature in LearnCard. End every agent task with a durable draft PR and honest, reviewable proof.
---

# Ship with proof

1. **Make work durable early.** Push your branch and open a **draft** PR with `gh pr create --draft` as soon as there is a meaningful commit. Push after each meaningful unit: assume the VM can die. For a stacked change, target its parent branch. Respect explicit operator restrictions on pushing or GitHub writes; report that exception rather than silently breaking it.
2. **Prove the change before saying done.** Run repo checks for the touched paths (including `bun scripts/lint-workspace.ts --files <changed files>` and focused tests/builds). Read [verify-learncard](../verify-learncard/SKILL.md) and its [feature map](../verify-learncard/features/README.md); run the matching `lc verify` features, or an ad-hoc `lc verify script` for anything not cataloged. Use `--video` for UI work. Follow that skill's Linux setup and full-catalog readiness gate rather than duplicating it here.
3. **Publish evidence from this head.** Commit the tested work, keep the checkout unchanged while verifying, and push it. Inspect the selected screenshots/videos for secrets or personal data before publishing to public URLs. From the repo root:

    ```bash
    bun scripts/proof.ts doctor
    bun scripts/proof.ts publish --pr <n> --from-run <run dir> --update-pr
    ```

    Use the exact retained `runs/<runId>` directory (or `scripts/<runId-name>` for an ad-hoc script), not the stack root. Use `--dry-run` to preview without network, `--note` for context, and `--not-verified "..."` for gaps. Never reuse stale evidence for a new head. No upload credentials means table-only proof; LearnCard Verification CI attaches media when the PR is marked ready (drafts are skipped). Partial configuration or a failed check is a blocker. macOS/Windows agents unable to run `lc verify` rely on that CI run and say so under **Not verified**; do not fabricate a local report. Keep sessions, traces, raw JSON reports and logs private.

4. **Leave a reviewable PR description:**
    - **What & why:** two plain sentences explaining the change and reason.
    - **Proof:** the generated `<!-- proof:start -->` / `<!-- proof:end -->` section, plus actual repo-check commands/results outside the markers.
    - **Not verified:** explicit, honest gaps and blockers (or explicitly none, only when justified).
    - **How to try it:** short reproducible steps.
5. **Finish with the PR URL and proof summary.** Keep it draft while local checks are missing or red. When local checks pass, mark ready to trigger required Linux CI, explicitly noting pending verification; do not claim readiness checks passed until CI is green. Never claim verification you did not run. Publishing a failed report is useful evidence, not a passing gate.
