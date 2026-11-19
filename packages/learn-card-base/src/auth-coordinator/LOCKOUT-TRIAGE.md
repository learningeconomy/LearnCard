# Support Runbook: User Claims Lockout Triage

This runbook provides a decision tree and diagnostic steps for support agents handling "I am locked out" or "I lost my account" tickets under the SSS (Shamir's Secret Sharing) key management system.

## 1. Intake Questions

When a user reports a lockout, ask these questions first to determine the failure domain:

1. **Can you log in to your school/signup email?** (Checks identity layer / Firebase access)
2. **Are you using the exact same device and browser as before?** (Checks device share layer)
3. **Do you see a "Needs Recovery" screen after logging in?** (Checks if device share is missing/stale)
4. **Which recovery methods did you fully confirm?** (Passkey, Phrase, Backup File, or Email)
5. **Is a personal/guardian recovery email verified on your account?** (Checks identity rebind viability)

## 2. Layer-by-Layer Diagnosis & Resolution

Use the user's symptoms and server-side `UserKey` fields to diagnose the issue.

| Symptom / User Report                                       | Failing Layer         | Server-Side Checks (`UserKey` fields)                                                                | Resolution Path                                                                                                                             |
| :---------------------------------------------------------- | :-------------------- | :--------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| "I lost my school email / I graduated and can't log in."    | **Identity**          | Check `authProviders` for the old UID. Check if `recoveryEmail` is set and verified.                 | Direct to **Lost School Login / Identity Rebind** flow. User enters recovery email, receives OTP, and binds a new login.                    |
| Logs in successfully but sees "Needs Recovery" screen.      | **Device Share**      | Check `sssActivationState` is `active`. Check `recoveryMethods[].confirmedAt` for available methods. | Direct to **Recovery Flow**. User must use a confirmed method (Passkey, Phrase, Backup File, or Email) to restore access on the new device. |
| "I tried to recover but it says my phrase/backup is wrong." | **Recovery Method**   | Check `recoveryMethods[].confirmedAt` to ensure the method was actually confirmed, not just pending. | User must try another confirmed method. If none exist or all fail, see Escalation.                                                          |
| "I'm stuck on a setup screen every time I log in."          | **Provisional State** | Check `sssActivationState` is `provisional`. Check `provisionalCreatedAt`.                           | Direct user to complete the mandatory recovery enrollment. They must confirm at least one method to activate their account.                 |
| "I logged in on my old phone and it says Needs Recovery."   | **Version Skew**      | Check `shareVersion`. The old phone has a stale device share from before a rotation.                 | Direct user to use a recovery method, or log in on their newer device. (History is purged on security rotation).                            |
| "I started migrating but now I'm back on the old system."   | **Provisional State** | Check if `provisionalCreatedAt` is older than 30 days (TTL purged).                                  | Direct user to restart the security upgrade process. (They are not locked out).                                                             |

**ClassLink students who lost their school login (LC-2409).** A ClassLink student who verified a personal email in the app has that address as their **sign-in email**: it is the Firebase email of their ClassLink login and the account's `contactMethod`. They should simply sign in with it by email code; they do not need the lost-login flow. On a new device they then enter their PIN (or use a passkey, phrase or backup file).

- **Lost-login rebind:** verifying the personal email clears an equal `recoveryEmail` and never sets one, so the **Lost School Login / Identity Rebind** flow only finds the account through a separate verified recovery email.
- **Escrow contact:** once the backup is re-sealed, the PIN backup (escrow) seals the personal email, so forgot-PIN hold codes go to the personal inbox. Accounts with a PIN re-seal by entering their current PIN once (the app asks); escrow accounts without a PIN re-seal at their next automatic rotation. Until then, hold codes keep going to the previously sealed address.
- **Placeholder accounts** (no school email, synthetic contact) can have escrow, a PIN and the 7-day forgot-PIN hold once the personal email is their sign-in email.
- **No-PIN escrow accounts:** after the 7-day hold, the release goes to whoever holds the personal inbox. This is the accepted bar for every email-login account.
- **School email:** while the district's domain is trusted, the student used ClassLink sign-in within the district's limit (`schoolEmailAliasMaxIdleDays`, default 365) and exactly one ClassLink identity has that address, the school email also signs in to the same account by email code.

Triage checks:

1. `ClassLinkIdentity.primaryEmail`: `state` (`active` = done, `pending` = an interrupted verify the next continuity check reconciles), `uid` (T, the login that holds the personal email), `prevFirebaseEmail` and `prevContactMethod` (what removal restores), and on a `pending` address change `replacedEmail` (the earlier personal address T may still hold).
2. `ClassLinkIdentity.demotePending`: a demote (after a rebind, revoke, School Connect move or account deletion) that has not run yet. A personal-email sign-in to an orphaned T is refused with a generic error, never creates an empty wallet, and retries the demote; the orphan cleanup script also finishes it.
3. `UserKey.escrowContactDigest` versus the sign-in email (remote mode only): a mismatch, or no digest on a promoted account, means the backup still seals the old contact; the app shows "Enter your PIN" (`nextStep: 'confirmPin'`).
4. The session uid versus `primaryUid` from `classlink.getAccountContinuity`: the PIN confirm only runs from T's session. Other devices (a PIN sign-in added another login) are asked to sign in with the personal email.
5. A confirm refused with `Choose a new PIN to continue.` hit the lca-api limit (10 failed confirms per PIN, or 2 share versions spent without a commit): the student chooses a new PIN.

## 3. Escalation: Unrecoverable Scenarios

Some scenarios are mathematically unrecoverable by design. Support **cannot** bypass these.

| Scenario                                  | Why it's unrecoverable                                                                                                                         | Suggested Plain-Language Phrasing                                                                                                                                              |
| :---------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lost Device + Zero Confirmed Methods**  | The user lost their device share and never completed Phase B enrollment (`confirmedAt` is missing for all methods).                            | _"Because LearnCard is non-custodial, we don't hold your keys. Since a recovery method wasn't fully confirmed before the device was lost, the account cannot be restored."_    |
| **Lost Device + Lost Recovery Methods**   | The user lost their device share AND lost access to all confirmed recovery methods (e.g., lost phrase, lost passkey device, lost backup file). | _"Your account is secured by keys only you control. Without your original device or your backup methods, the cryptographic key cannot be rebuilt. We cannot override this."_   |
| **Lost School Login + No Recovery Email** | The user lost their Firebase identity and never verified a personal `recoveryEmail` for the OTP rebind flow.                                   | _"To link a new login to your existing account, we need to verify it's you via your backup email. Since no backup email was verified, we cannot safely transfer the account."_ |

A ClassLink student who verified a personal email in the app usually signs in with it instead of rebinding; see the ClassLink note in section 2.

## 4. What Support Must NEVER Do

- **NEVER ask for or handle a user's recovery phrase, backup file, or password.**
- **NEVER manually edit `authProviders` or `recoveryMethods` in the database.** (Identity rebinds and method enrollments require cryptographic DID challenges).
- **NEVER attempt to manually change `sssActivationState` to `active`.** (This requires a single-update commit with a version-matched, confirmed method).
- **NEVER ask for or handle a user's device share or auth share.**
- **NEVER bypass the email OTP requirement for identity rebinds.**
