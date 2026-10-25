# LearnCard App

The **LearnCard App** is a digital wallet for verifiable credentials. It allows users to claim, store, organize, and share their achievements, badges, certifications, and IDs.

Available on:

- 📱 iOS ([App Store](https://apps.apple.com/us/app/learncard/id1635841898))
- 📱 Android ([Google Play](https://play.google.com/store/apps/details?id=com.learncard.app))
- 🌐 Web ([app.learncard.com](https://app.learncard.com))

---

## Supported browsers and devices

Tailwind 4 requires Safari 16.4+, Chrome 111+, or Firefox 128+. The iOS app
requires iOS 16.4 or later. On Android, keep Android System WebView or Chrome
updated to version 111 or later; the Android OS version alone does not determine
support. Native builds check the standard Android WebView minimum and show a
standalone notice if the browser cannot open the app. Update Android System
WebView or Chrome through the device's app store, then reopen the app.
See [Tailwind's browser requirements](https://tailwindcss.com/docs/compatibility).

## Key Features

| Feature               | Description                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| **Claim Credentials** | Scan QR codes or click links to add credentials to your wallet         |
| **Organize**          | Categorize credentials by type (achievements, IDs, work history, etc.) |
| **Share**             | Generate shareable links or presentations for verifiers                |
| **Connect**           | Find and connect with other profiles on the LearnCard Network          |
| **Consent**           | Control what data you share and with whom                              |

---

## User Flows

### Claiming a Credential

```mermaid
flowchart LR
    A[User receives link/QR] --> B[Opens in LearnCard App]
    B --> C{Logged in?}
    C -->|No| D[Create account / Login]
    C -->|Yes| E[Review credential]
    D --> E
    E --> F[Accept & Save]
    F --> G[Credential in wallet]
```

1. User receives a claim link or scans a QR code
2. Link opens the LearnCard App
3. User logs in (or creates an account)
4. User reviews the credential details
5. User accepts and saves to their wallet

### Email Claims Requiring Guardian Approval

An email claim can show **Waiting for guardian approval** when a parent or guardian
must approve a credential. After approval, choose **Check Again** using the same
claim link. The app starts a fresh check; you do not need another issuance.

If a batch includes credentials ready to accept, save those first. The waiting
summary remains available for the others. A declined credential shows a separate
message; an expired or unavailable claim keeps its existing error state.

Account approval is separate from credential approval. If your account also needs
approval, **Request Account Approval** opens the existing consent form. Sending
that request does not approve the account or any credential.

```mermaid
flowchart LR
    A[Open email claim link] --> B{Guardian decision}
    B -->|Waiting| C[Waiting for guardian approval]
    C --> D[Guardian approves]
    D --> E[Check Again with same link]
    E --> F[Accept and save]
    B -->|Approved or not required| F
    B -->|Declined| G[Declined message]
```

### Receiving Credentials from a Website

For a browser credential offer, choose LearnCard in the website’s account chooser. The **Add to Passport** page lists every offered credential; expand **Details** to inspect one before choosing **Save to Passport** or **Cancel**. Saving disables the action buttons until it finishes. If part of a batch fails, **Try Again** continues without adding completed items again. Exact retries reuse the saved signed credential; a different revision is saved separately even if the issuer keeps the same credential ID. An unsupported offer or a failed exchange shows a visible error instead of leaving **Accepting…** on screen. Cancel remains available while the website’s request is loading. If you switch accounts, return to the issuing website and start a new request. If the credentials are saved but the website cannot be notified, the page tells you; retrying that notification is not offered. A failed cancellation also tells you to return to the website, without offering a retry on the used request. Cancelling after a partial save keeps the credentials already saved and shows their count. Start a new offer on the issuing website if the request has expired.

### Sharing a Credential

```mermaid
flowchart LR
    A[Select credential] --> B[Tap Share]
    B --> C[Choose method]
    C --> D[QR Code]
    C --> E[Link]
    C --> F[Presentation]
```

1. User selects a credential from their wallet
2. Taps "Share"
3. Chooses sharing method:
    - **QR Code** — For in-person verification
    - **Link** — For sending digitally
    - **Presentation** — For formal verification requests

For browser application requests (CHAPI or VC-API), use the credential list to search and filter by category. **View selected** shows the entire selected batch, even when search hides some items. **Deselect all** clears the selection. Open **Review** to check or remove items before sending; returning to selection sends nothing. Suggested credentials remain editable.

### Private Verifier History

Click a verifier entry to expand the list of credential names recorded for that send. This uses the existing encrypted history; it does not fetch full credentials or show every claim sent.

The card shows the five newest entries. Choose **View all** to open the full history, with 20 entries per page. Refresh, Clear history and Delete entry are available in the history window; changes also update the card.

In **Data Sharing Center**, **Shared with verifiers** loads automatically and shows recording controls and any entries. Recording is off by default and is unavailable for managed accounts. Disabling recording keeps previous entries; clearing readable history keeps the preference.

```mermaid
flowchart LR
    A[Open Data Sharing Center] --> B[Enable recording]
    B --> C[Send credentials]
    C --> D[Confirm current consent]
    D --> E[Save encrypted entry]
    E --> F[View or clear entries]
```

An entry records successful sending or a browser handoff, not verifier acceptance. It contains the visible credential titles and, where shown during review, the verifier name, origin and purpose. It contains no credentials, claims, credential addresses or link keys. Deleting history cannot retract information already sent.

The app keeps an owner-encrypted consent snapshot on the device. Sending does not look up history in Cloud first. Without a readable local snapshot, recording is skipped until you visit Data Sharing Center on that device; current consent is checked after sending before an entry is saved.

History displays at most 500 entries from the last 90 days. Cleanup runs when history is successfully accessed; offline clients cannot guarantee immediate physical deletion. Unreadable records are hidden and are not automatically deleted. **Clear history** can remove them by their exact document IDs; unknown consent is then kept off for safety. Future-dated entries are hidden until the local clock catches up and are not removed solely because of clock skew.

**Clear history** asks for confirmation before deleting entries, including from a recovery state. Cancel leaves history and recording unchanged. If a Clear read returns no settings, recording turns off for safety, even if it was previously on.

If history cannot be loaded, **Clear history** remains available to reset recording to off when its settings are missing or unreadable. A cleanup warning means some records could not be removed; try Clear again. An unreadable encrypted document also prevents recording until recovery. A confirmed entry remains saved even when cleanup is incomplete.

If your account changes after an OID4VP send completes, the success screen says so and hides the earlier account’s details. It does not redirect to the verifier under the new account; return to the requesting application to finish its session.

### Uploading an Original Document

Open **Build My LearnCard**, then choose Resume, Certificates, Transcripts or Diplomas.
Select a supported file. Review any extracted credentials and choose which ones to save.

If uploads are busy, the app shows **Waiting for a turn…** and automatically tries again
for up to two minutes, respecting the service's retry delay. Select **Cancel** or close the
upload step to stop waiting. Closing the app stops retries; there is no background queue.
If capacity remains unavailable, the file stays unsaved and you can try again shortly.
Only requests explicitly rejected before processing are retried automatically.
Once extraction has started, the existing **Notify me when it's ready** behavior still applies.

```mermaid
flowchart LR
    A[Choose document] --> B{Extraction result}
    B -->|Credentials found| C[Review and select]
    C --> D[Save original and selection]
    B -->|Empty or no readable text| J[Show feedback without creating a credential]
    B -->|Processing failed| E[Save original only]
    B -->|Settings pending or request rejected| I[Leave the saved document unchanged]
    D --> F{Save confirmed?}
    E --> F
    F -->|Yes| G[Open original by selecting its filename]
    F -->|No| H[Retry saving]
```

The saved original appears in one document card. Select its filename to open it.
When credentials are added, the card shows the confirmed count; there is no separate
success banner or action box.
Preview uses a supported filename extension when a device supplies no specific file type.
It never overrides an explicit HTML or SVG type.

An empty result or a file with no readable text does not create a credential or save a new
original. While the upload step is open, select its filename to preview the uploaded file,
choose another file, or retry extraction.
In a mixed batch, saving the review only stores originals that produced review candidates;
empty files are not saved alongside them.
Pending AI settings, invalid or rejected input, oversized files, and incompatible service
responses do not add a new saved original or replace a résumé. Feedback explains the reason
and omits extraction retry for non-retryable rejections.
With AI disabled, uploads still save the original without sending it for AI processing or
offering extraction retry. A file already known to be empty remains unsaved.
Transient processing failures still keep the original when its save succeeds. A failed save
does not claim that the file is saved; retry saving without running extraction again.
The extraction overlay closes when the original starts saving. An inline message explains
that extraction failed and saving is in progress; it only says the original is saved after
the save is confirmed.

Review can be closed and reopened within the same app session. Selecting none still saves
the original, but does not mean extraction found nothing. Saved counts include only confirmed
selected credentials. Partial failures retain the review; retrying a save reuses confirmed writes.
For résumés, going Back clears the save-error message without discarding the pending review.
Starting another upload clears the previous error message immediately.

Confirmed saves trigger one background sharing sync instead of waiting for sharing on every
credential. Insights refresh only after that sync succeeds; a sharing failure does not
undo confirmed saves, change their counts, or request an insight from incomplete server data.

Use **Update** for another résumé or **Add More** for other documents. These actions sit
below the saved document cards. Failed extraction and storage still have their own retry
feedback. Reopening a manager shows saved originals without inventing a credential count.
An unreadable original remains listed as unavailable and can still be deleted. It does
not hide other documents; readable legacy originals remain accessible.
Uploaded originals are hidden from **Recently Added** and **See all**. Extracted
credentials and published résumés remain visible.

Deleting an original immediately removes its row and upload feedback together. If deletion
fails, both return with an error. Other documents and their feedback remain unchanged.
If a résumé has already been replaced when deletion starts, the newer upload is kept.

**Deployment prerequisite:** deploy AI Passport's versioned extraction metadata before this
app release. An incompatible response leaves saved documents unchanged; retry after the
compatible backend is available.

### Publishing a Résumé

Resume Builder publishes one managed link for each résumé. Republishing an active résumé updates that link. Find its entry in **Shared** to change the title, passcode or expiry, or stop access. Edit the résumé itself in Resume Builder.

```mermaid
flowchart LR
    A[Prepare résumé] --> B[Publish managed link]
    B --> C[One entry in Shared]
    C --> D[Recipient opens link]
    D --> E[Enter passcode if required]
    E --> F[Review and download PDF]
    C --> G[Change expiry or stop access]
```

New links expire after 30 days by default. Both the résumé and its PDF follow the link's access settings. A recipient downloads the PDF explicitly; opening the link does not preload it.

{% hint style="warning" %}
Stopping access cannot retract downloaded copies or older résumé URLs. Including a credential includes its original signed claims, even when some fields are hidden on the PDF.
{% endhint %}

If publishing is interrupted, retry in the same browser to recover the pending attempt. PDFs larger than 4 MiB cannot be published through this flow. Turn off the QR code to download a local copy without publishing.

### Qualifications

Qualifications has its own section after IDs in the wallet and navigation, even when it is empty. It contains professional licenses, certifications, and apprenticeship, journeyman, and master certificates.

- Existing credentials in their original automatic category move to Qualifications in the background after the account opens; account access does not wait for this scan. Successful scans are remembered for that account and cloud service. Unavailable credentials retry on the next app session, not on every account operation. Saved manual overrides, explicit credential categories, and custom Boost categories stay unchanged. Older choices without a manual-choice marker are treated as automatic defaults.
- Qualification credentials default to an orange certificate frame with Qualifications corner glyphs; explicit display settings and recognized achievement types take precedence.
- Colorful matches the other section shades: orange-300 Passport tiles and selected tabs, orange-400 page headers, orange-200 page backgrounds, and orange-500 count badges with dark text. Actions keep darker orange for readable contrast. Neutral Mode uses white backgrounds for all Passport categories in tile and list views, and keeps the Colorful Solid Color Qualifications glyph in both layouts. Other icon placements retain their theme-specific artwork. Colorful has a dedicated empty-state illustration; Formal keeps its shared empty-state placeholder. Credential image fallbacks also use Qualifications artwork instead of the Achievements trophy.
- Click **professional qualifications** on the Qualifications page to open **About Qualifications**, with Qualifications artwork and a short explanation of professional licenses, certifications, and apprenticeship, journeyman, or master certificates.
- Certificate previews keep the issuer's details and seal inside the frame, above the category label.
- Expiration dates remain visible. An expired qualification stays in the account and can still be opened or shared.
- Identification documents, such as passports and driver's licenses, remain in IDs.
- Resumes keep Achievements alongside Qualifications. Existing saved section order, hidden sections, dates, and edited descriptions remain intact when an older resume is opened.

### Self-Assigning Skills

```mermaid
flowchart LR
    A[Open Skills Hub] --> B[Tap + button]
    B --> C[Search or browse skills]
    C --> D[Select skills]
    D --> E[Set proficiency levels]
    E --> F[Save]
    F --> G[Skills in wallet]
```

1. User opens the Skills Hub from their wallet
2. Taps the **+** button to add skills
3. Searches by skill name or occupation, or browses suggested skills across the available frameworks
4. Selects one or more skills from a framework
5. Sets a proficiency level for each skill:
    - **Hidden** — Do not display proficiency status
    - **Novice** — Just starting and needs guidance
    - **Beginner** — Handles simple tasks without support
    - **Proficient** — Works independently on routine tasks
    - **Advanced** — Solves complex tasks efficiently
    - **Expert** — Deep mastery; can lead and mentor others
6. Saves the self-attested skills to their wallet

{% hint style="info" %}
Self-assigned skills are **self-attested credentials**. They represent what a user claims about their own abilities. For third-party verified skills, see issued credentials from organizations.
{% endhint %}

---

## Account Security & Recovery

Each account is controlled by a private key that never exists in one place: it is split into pieces held by the user's device, LearnCard's servers, and the user's recovery methods, and any two pieces are needed to sign in. Neither LearnCard nor a stolen phone alone can access the account.

After signing up, users are prompted to set up at least one recovery method:

| Method              | What it is                                                |
| ------------------- | --------------------------------------------------------- |
| **Passkey**         | Face ID, Touch ID, or a hardware key on the user's device |
| **Recovery Phrase** | A 24-word phrase the user writes down                     |
| **Backup File**     | A password-protected file the user downloads              |
| **Email Backup**    | An encrypted backup sent to a verified email address      |

Signing in on a new device works either by scanning a QR code from a device that's already signed in, or by using one of the recovery methods. Recovery settings live under **Account Recovery** in the profile.

For how this works under the hood, see [Key Management (SSS)](../../core-concepts/identities-and-keys/key-management-sss.md).

---

## Related Documentation

- [Export & Import Your Data](../../how-to-guides/export-and-import-your-data.md) — Take your data with you
- [Send & Issue Credentials](../../how-to-guides/send-credentials.md) — For organizations issuing into the app
- [Build an App Inside LearnCard](../../how-to-guides/publish-your-app.md) — Build an experience inside the app
- [Verify Credentials](../../tutorials/verify-credentials.md) — For verifiers
- [ConsentFlow Overview](../../core-concepts/consent-and-permissions/consentflow-overview.md) — How users control what they share
