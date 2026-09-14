---
'@learncard/ai-agent-service': patch
'@learncard/network-brain-client': patch
'learn-card-app': patch
---

Deploy the AI Agent through the main Deploy workflow: affected main commits deploy staging, and Changesets releases deploy production using the existing environment approval and LaunchDarkly rollout controls.

Bind agent operations to verified request identity, expose only permitted wallet capabilities and anonymous public profile reads, recover assistant storage and schedules safely, and include retrospective work in run budgets. Fix assistant chat lifecycle, history limits, privacy gating, and local endpoint selection.
