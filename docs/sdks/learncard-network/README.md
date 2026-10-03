# Network API

{% hint style="info" %}
**Looking for endpoints?** The full OpenAPI spec is rendered in the sidebar below this section's pages — one page per resource (Profiles, Credentials, Boosts, …) with request and response models. Prefer to try calls live? Use the [interactive docs](https://network.learncard.com/docs#/). Base URL: `https://network.learncard.com/api`.
{% endhint %}

The **LearnCloud Network** provides backend infrastructure for managing verifiable credentials, digital identities, user profiles, and consent flows in the LearnCard ecosystem.&#x20;

This API provides a set of convenient endpoints that allow you to manage credentials, boosts, and presentations associated with user profiles. Here's a quick high-level summary of what you can do with the API:

1. **Profile Management**: Create, update, and search user profiles
2. **Credentials**: Send, accept, retrieve, and delete credentials between users on the LearnCard Network. Credentials can be used to represent skills, achievements, or other information related to a user's profile.
3. **Boosts**: Create, send, update, delete, and claim boosts for users on the network. Boosts are a way to reward and incentivize user interactions, such as completing tasks or participating in events.
4. **Presentations**: Send, accept, retrieve, and delete presentations between users. Presentations are packages of credentials that can be shared with others to demonstrate the user's skills or achievements.
5. **Consent Flow**: Manage consent contracts for data sharing and credential issuance
6. **DID Web Resolution**: Provide DID Web identity resolution
7. **Notification System**: Send notifications for various events
8. **Utilities**: Check the health of the API endpoint, retrieve a list of valid challenges, and obtain the LearnCard Network Decentralized Identifier (DID).
9. **Storage**: Store and resolve credentials or presentations using a unique identifier (URI).
10. **Skills Semantic Search**: Generate embeddings for skill content and query skills by semantic similarity.
11. **OpenSALT Skill Frameworks**: Link OpenSALT/CASE frameworks, sync skills, and reuse standards in boost alignment flows.

**The LearnCard Network API** makes it simple to create engaging and interactive applications that utilize credentials, boosts, and presentations between users and applications.

## Managed résumé attachments

The network plugin exposes these attachment methods through `learnCard.invoke`. They transfer encrypted chunks; callers encrypt and sign the PDF descriptor locally. The decryption key belongs inside the encrypted share content, not in these requests.

| Method                            | Input                                                                                                    | Access and result                                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `putShareLinkAttachmentChunk`     | `id`, `contentVersion`, `attachmentId`, `chunkIndex`, `chunkCount`, `envelope`, `ownerEncryptedRecovery` | Authenticated owner stages an immutable encrypted chunk; returns `{ ok: true }`.                                                   |
| `getShareLinkAttachmentChunk`     | `id`, `contentVersion`, `attachmentId`, `chunkIndex`, optional `passcode` or `accessToken`               | Public managed-policy read; returns the exact chunk binding, `envelope` and optional short-lived `accessToken`.                    |
| `deleteShareLinkAttachmentChunks` | `id`, `contentVersion`, `attachmentId`, `chunkCount`                                                     | Authenticated owner discards an unreferenced stage; returns `{ ok: boolean }`. Active or uncertain references cannot be discarded. |

Stage every chunk before creating or updating share content with `attachment: { id: attachmentId, chunkCount }`. The service verifies completeness and pins the stage before committing it. Retry identical staged bytes and the original publication operation after an uncertain response; allocating a new operation can create a duplicate publication.

The résumé format allows a 4 MiB PDF split into at most 16 chunks of 256 KiB raw bytes. The gateway checks current active state, expiry, passcode and exact committed content version on every read, including a second check after storage retrieval. The returned grant amortizes one successful passcode check across chunks for 60 seconds and cannot override a stopped, expired, changed or newly password-protected share.

Never-committed stages expire after 24 hours and are collected by managed-share maintenance. Stop and content replacement queue chunk deletion. Expiry blocks reads immediately but preserves committed ciphertext for an owner to extend expiry. Deletion is asynchronous and does not retract previously decrypted copies. These methods require the existing managed-share storage and maintenance configuration.
