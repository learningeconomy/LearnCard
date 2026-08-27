---
description: A 60-second guide to picking the right LearnCard SDK or API.
---

# Which SDK Do I Need?

| If you want to…                                             | Use                                                                                                                        | Runs where               |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Send credentials to emails/phones, manage profiles & boosts | [LearnCloud Network API](learncard-network/README.md) (or the [Wallet SDK](learncard-core/README.md) with `network: true`) | Your server              |
| Build an app for the LearnCard app store                    | [Partner Connect SDK](partner-connect.md)                                                                                  | Your web app (iframe)    |
| Add a credential claim button to a webpage                  | [Embed SDK](embed-sdk.md)                                                                                                  | Any webpage (script tag) |
| Create/verify credentials, manage a wallet programmatically | [LearnCard Wallet SDK](learncard-core/README.md)                                                                           | Server or browser        |
| Store/query encrypted user data or xAPI learning records    | [LearnCloud Storage API](learncloud-storage-api/README.md)                                                                 | Your server              |
| Passwordless key management for your own app                | [SSS Key Manager](sss-key-manager.md)                                                                                      | Your web app             |
| Script against LearnCard from a terminal                    | [LearnCard CLI](learncard-cli.md)                                                                                          | Your machine             |

**Rules of thumb:**

-   Most integrations only need **one API call** — start with the [quickstart](../quick-start/your-first-integration.md) before reaching for an SDK.
-   The **Wallet SDK** (`@learncard/init`) is the power tool: it does everything, but you rarely need all of it.
-   **Partner Connect** and **Embed SDK** are opposites: Partner Connect puts _your app inside LearnCard_; Embed SDK puts _LearnCard inside your app_.
