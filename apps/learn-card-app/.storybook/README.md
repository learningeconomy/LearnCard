# Upload capacity UI review

From the repository root, with workspace dependencies installed:

```bash
bun run --cwd apps/learn-card-app storybook
```

Open http://localhost:6007 and select **Uploads → Capacity**:

- **Waiting**: busy message and **Cancel**.
- **Processing**: accepted-upload loading state.
- **Wait Expired**: busy outcome and **Try Again**.
- **Ready For Review**: completed extraction ready for review.

Use the Actions panel to check Cancel/Try Again callbacks. These are supplied UI states, not live uploads; focused tests cover retry timing, cancellation, and preserving earlier batch results.

Testing real capacity exhaustion and recovery requires a separate Fly app configured like production, including its upload limits and routing. The current frontend targets the live AI service, so exercising that flow without an isolated backend would affect production uploads. Use Storybook for this PR's visual QA rather than filling live upload slots.
