[<img src="https://user-images.githubusercontent.com/2185016/176284693-4ca14052-d067-4ea5-b170-c6cd2594ee23.png" width="400"/>](image.png)

# LearnCard App

The LearnCard App is a **universal digital wallet** for learners and employees to **issue, earn, store, share,** and **spend currency and credentials** for web, iOS, and Android devices.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Running Native Builds + Hot Reload

[Capacitor Hot Reload](https://dev.to/aaronksaunders/running-react-with-ionic-capacitor-live-reload-32nn)

[Capacitor Config](https://capacitorjs.com/docs/config)

For now:
(ios)

1. `bun run start --host`
2. copy network address from terminal IE: "http://10.6.17.241:3000"
3. update the `capacitor.config.ts` file at the root of the project, add the following config field
    - `server: { url: "http://10.6.17.241:3000" }`
4. `bunx cap sync`
5. `bunx cap open ios`
6. select simulator on XCode + make changes locally, HMR should be enabled
7. alternatively, you can run `bunx cap run ios` ... select a simulator from the terminal + make changes locally, HMR should be enabled as well
8. Do not commit the following, remove the `server: { url: "http://10.6.17.241:3000" }` config field from `capacitor.config.ts` when not developing this is for local development only (NOT PRODUCTION)!

### iOS simulator architecture and QR testing

Google ML Kit Barcode Scanning 8 does not provide an arm64 simulator slice, and iOS 27 simulators on
Apple Silicon cannot install an x86_64-only app. The native project therefore substitutes an explicit
"unsupported" barcode plugin only for simulator SDK builds. Debug and Release physical-device builds
still compile and link the real ML Kit implementation, preserving native arm64 QR scanning.

Use an iOS simulator for launch, lifecycle, sign-in UI, callback URL, and universal-link checks. Use a
physical iOS device with either a Debug or Release build for the final camera/QR scan because the
simulator intentionally uses the unsupported stub.

### Native smoke-test checklist

After `bun scripts/prepare-native-config.ts <tenant> [--stage <stage>]` and `bunx cap sync`:

1. Launch on iOS 27 and an iOS 26 simulator/device, background and foreground the app repeatedly,
   and confirm there is no scene-lifecycle runtime assertion.
2. Complete email-code, Apple, and Google sign-in. Cancel or interrupt each flow once, retry it, and
   confirm the callback returns to the app.
3. Open one configured custom-scheme URL and one configured universal link from outside the app,
   both on a cold launch and while the app is already running.
4. On a physical iOS device, grant camera access and scan a QR code. Cancel and restart the scanner,
   then scan another code.
5. Build and launch Android, repeat the sign-in callback/deep-link checks, and scan a QR code.

(android)
`bun run start-android`

## Testing

E2E tests are written using [Playwright](https://playwright.dev/), which may require some setup.
Usually, this is as simple as running the following command:

```bash
bunx playwright install
```

If you forgot to run it, you'll likely see an error asking you to. If that _still_ doesn't work, you
may need to install some system dependencies. See the Playwright docs [here](https://playwright.dev/docs/cli#install-browsers) for more info.

After playwright is set up, you can simply run `bun run test` or `bunx nx test learn-card-app` to run the E2E tests!

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Who is Learning Economy Foundation?

**[Learning Economy Foundation (LEF)](https://www.learningeconomy.io)** is a 501(c)(3) non-profit organization leveraging global standards and web3 protocols to bring quality skills and equal opportunity to every human on earth, and address the persistent inequities that exist around the globe in education and employment. We help you build the future of education and work with:

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
