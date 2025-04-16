---
'@learncard/network-brain-service': patch
---

# Add HTTP route for sending boosts via signing authority

This update introduces a new LearnCard Network service-level route, `/boost/send/via-signing-authority`, that allows a profile to send a boost (credential) to another profile using a registered signing authority. This is particularly useful for workflows where the server does not have access to user key material and must delegate credential issuance to an external signing authority.

Key features:

-   New POST route `/boost/send/via-signing-authority` for sending boosts via HTTP
-   Supports specifying the recipient profile, boost URI, and signing authority details
-   Issues credentials using the provided signing authority and delivers them to the recipient
-   Includes E2E test demonstrating direct HTTP usage and signing authority setup
-   Documentation updated to reflect the new pattern and best practices for AI assistants

This change makes it easier for external services and clients to programmatically send boosts in a secure and user-friendly way, even when user keys are not available server-side.
