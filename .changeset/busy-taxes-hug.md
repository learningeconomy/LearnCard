---
'@learncard/app-store-demo-request-learner-context': patch
'@learncard/learn-cloud-service': patch
'@learncard/network-brain-service': patch
'@learncard/partner-connect': patch
'@learncard/network-plugin': patch
'@learncard/lca-api-service': patch
'@learncard/types': patch
'learn-card-base': patch
'learn-card-app': patch
---

Add `sendAiSessionCredential` to Partner Connect SDK for recording AI tutoring sessions.

This enables App Store embedded apps to send AI Session credentials that are automatically organized under AI Topics. The feature includes:

- **Partner Connect SDK**: New `sendAiSessionCredential()` method with structured summary data support
- **Backend Support**: App event handler for `send-ai-session-credential` with listing-owned boost creation
- **AI Topic Hierarchy**: Sessions are automatically organized under a parent AI Topic per app
- **Client-Side Storage**: Credentials are immediately stored in the user's LearnCloud wallet
- **Example App**: Updated with working AI Session creation flow

Apps can now record structured learning sessions with key takeaways, skills demonstrated, learning outcomes, and recommended next steps that appear in the user's AI Topics page.
