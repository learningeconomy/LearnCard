---
"learn-card-base": patch
"learn-card-app": patch
"@learncard/lca-api-service": patch
---

Web3Auth sign-in now checks which method the account signs in with before deriving a key. If the account uses SSS and this login would derive a different key, sign-in stops and asks the user to update the app instead of creating a different, empty identity. Accounts migrated from Web3Auth keep signing in with Web3Auth through the login they migrated with: lca-api records that login at `/keys/migrate` (`web3AuthLogin`, only when it is the account's sole login) and reports `isWeb3AuthLogin` from `/keys/auth-share`. Migrations from before this change have no recorded login and are stopped on Web3Auth builds.
