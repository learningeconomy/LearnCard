# Firebase email OTP claim emulator check

`firebase-otp-custom-token-emulator.mjs` checks that extra claims on an emulated Firebase custom token appear in the resulting ID token, remain present after `getIdTokenResult(true)`, and pass the shared proof validator. It uses a fake `demo-` project, a synthetic `.invalid` address, an unsigned emulator-only token and a loopback-only Auth emulator. It never prints tokens, and it refuses a non-loopback emulator host.

Install the app workspace's dependencies and build `@learncard/types` and `@learncard/helpers` first. The test does not add Firebase tooling as a production dependency. To run it with a pinned Firebase CLI in a temporary directory (the one-time CLI install needs network access):

```sh
mkdir -p /tmp/lc-firebase-otp-emulator
cd /tmp/lc-firebase-otp-emulator
bun add firebase-tools@14.23.0
cat > firebase.json <<'JSON'
{"emulators":{"auth":{"host":"127.0.0.1","port":19099},"ui":{"enabled":false},"singleProjectMode":true}}
JSON
env -u GOOGLE_APPLICATION_CREDENTIALS -u FIREBASE_TOKEN -u GCLOUD_PROJECT -u GOOGLE_CLOUD_PROJECT CI=true \
    ./node_modules/.bin/firebase emulators:exec --project demo-lc-otp-proof --only auth \
    'node /ABSOLUTE/PATH/TO/LearnCard/services/learn-card-network/lca-api/test/firebase-otp-custom-token-emulator.mjs'
```

Replace `/ABSOLUTE/PATH/TO/LearnCard` with this checkout's path. Select an unused loopback port if 19099 is busy. Success prints `Initial and forced-refresh ID tokens retained the OTP proof claims.` The CLI then shuts down the emulator. The emulator issues unsigned tokens and doesn't reproduce production signature or expiry validation; this check does not replace a real-provider staging signup and refresh test.
