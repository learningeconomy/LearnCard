# Native profile photos

Account → Edit profile supports choosing, previewing, replacing and removing a profile photo. The system Photos picker grants access only to the selected image. The preview is square with rounded corners, matching the header/account avatar. Real account pictures take precedence over the drawn fallback.

## Draft and save behavior

Selecting a photo is local; only **Save Profile** uploads it and updates the public LearnCard profile. The caption explains that the photo becomes public on save. Back discards unsubmitted changes. Cancelling Photos preserves the name, bio and current photo draft. Name/bio-only saves omit `image`, preserving the current photo; removal sends `image: ''`, matching the web editor. Save updates the account state immediately, so the header and account avatar observe the new URL.

Image preparation downsamples with ImageIO before decoding, applies source orientation, center-crops to a square, flattens transparency onto white and re-encodes pixels as JPEG. Source EXIF/GPS metadata is discarded. Inputs are bounded at 25 MB, 16,000 pixels per side and 80 megapixels; the thumbnail is at most 1,024 pixels per side and the uploaded JPEG at most 1 MB. Preparation runs off the main actor. The first frame is used for animated images. Crop repositioning, camera capture and animated profile photos are outside this slice.

The existing ephemeral Filestack uploader supplies `profile-photo.jpg` and never account authentication, source filenames or metadata. It rejects redirects and accepts only an HTTPS reply from the configured CDN. The account runtime independently validates replacement URLs before sending the existing network `updateProfile` request. It does not modify Firebase identity or credentials.

## Failure and lifecycle behavior

Preparation, upload and save show contextual progress and friendly errors. Editing/navigation is disabled while Save is running. A failed upload or profile update leaves the draft for retry. A successfully uploaded URL is reused if the profile update failed and the same image is retried; choosing another photo uploads the new pixels. Background lock/sign-out clear the cache. Generation checks after upload and after profile update prevent stale work from writing through a disposed account host or reopening its UI. A request already accepted by the remote service can complete there; the next resume reads server state. An uploaded but unreferenced public file may remain if saving is interrupted; there is no supported provider-delete operation in this client.

## Verification

The tests use synthetic images, a local fake uploader and disposable fixture accounts. They never upload or change the signed-in review account.

- Bun: unchanged/removal/replacement payloads, provider URL validation and invalid input.
- Swift: bounded square JPEG and metadata stripping; four-locale copy; upload failure/retry, URL reuse, replacement, removal, existing-photo preservation and deterministic background/sign-out races.
- Simulator: draft cancellation, failed-save retry, save/reopen, name-only preservation, remove/resume, system picker cancellation and Arabic accessibility layout.

Manual gates: choose an actual library photo and explicitly save it on the dedicated staging account; verify the same photo in web LearnCard and after relaunch. Exercise Photos permissions and orientation on physical devices. No live profile mutation is performed by automated checks.

## Source landmarks

`ios/Sources/EditAccountProfileView.swift` → `NativeAccountController.swift` → `ArtworkUploader.swift` → `AccountRuntime.swift` → `account-runtime/profile-update.ts` and the existing profile command in `runtime.ts`. `ProfilePhoto.swift` owns pixel preparation and the keep/remove/replace distinction. `AccountFixture.swift` supplies DEBUG-only offline boundaries; `--profile-photo-fixture` exposes a synthetic selection action only for automated UI runs.
