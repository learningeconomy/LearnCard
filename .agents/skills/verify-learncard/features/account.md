# Sign-in & account

A visitor lands on the public sign-in page, a new account signs in with a seed, completes onboarding ("Welcome — let's set you up" → "Make it yours" → "You're in!"), keeps the session across reloads, and signs out so private routes bounce back to `/login`.

## Sub-features

- `auth-public-email-entry`: the public `/login` email field enables and disables **Sign in with Email**. Nothing is submitted.
- `auth-developer-seed`: developer seed sign-in at `/developer/sign-in` lands on a signed-in `/wallet` that survives reload.
- `auth-onboarding`: a signed-in account without a network profile is sent through real onboarding from `/login`, and the new handle shows in the profile menu and on the network.
- `auth-sign-out`: **Logout** returns to `/login`, and `/wallet` then redirects to `/login`.

## How to get to it (user POV)

- Open `/login` on the app origin reported by `doctor`, signed out.
- Open `/developer/sign-in`, paste a 64-hex seed, and choose **Sign in**.
- With a signed-in account that has no profile, open `/login`; onboarding opens as a full-screen modal.
- Open the avatar (**Open profile**), then choose **Logout**.

## Driving it with lc verify

Preconditions:

- `$LCV doctor --dir /tmp/lcv` is ok. Ports are allocated per directory and stored in `state.json`; read the app origin from doctor output (`endpoints.app`) or `v.stack`, never a fixed port.

- **Run the journey.** `$LCV run account --dir /tmp/lcv`. `runs/<id>/report.json` shows `account: passed` with all four entries and `observations.networkProfile.profileId` equal to the new handle.
- **Public email field.** `getByRole('textbox', { name: 'Email' })` fills `verification@example.com`. `getByRole('button', { name: 'Sign in with Email' })` goes from disabled to enabled, then back to disabled when cleared. The URL stays on `/login`.
- **Seed sign-in without a profile.** `v.signIn(page, actor, { createProfile: false })`, then reload. **Open profile** is visible on `/wallet`.
- **Onboarding.** `page.goto('/login')`, and the heading `Welcome — let's set you up` appears. `tests/setup-auth.ts::finishSetupSignIn(page, handle)` picks a birth year and the United States, fills **Full name** and **Public handle**, chooses **Create my LearnCard** and then **Explore LearnCard**. After reload, the profile menu shows the handle, and `sdk(observer).invoke.getProfile(handle)` returns it.
- **Sign out.** Choose **Logout**: the URL becomes `/login`, and visiting `/wallet` lands back on `/login` with the English sign-in form.

## Gotchas

- The seed input is a password field: `getByRole('textbox')` can't see it. Use the placeholder `64 characters, 0–9 and a–f`.
- `/developer/sign-in?profileId=<handle>` creates the profile during sign-in, which skips onboarding. Use `createProfile: false` to exercise onboarding.
- Onboarding only opens from `/login`; the developer sign-in page goes straight to `/wallet`.
- The first render of a fresh context takes about 25s on the dev server.
- Submitting the email form would need an OTP provider that this stack doesn't have.
