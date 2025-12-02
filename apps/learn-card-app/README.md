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
1. ```pnpm start --host```
2. copy network address from terminal IE: "http://10.6.17.241:3000" 
3. update the ```capacitor.config.ts``` file at the root of the project, add the following config field
   - ```server: { url: "http://10.6.17.241:3000" }```
4. ```npx cap sync```
5. ```npx cap open ios```
6. select simulator on XCode + make changes locally, HMR should be enabled 🚀🎉
7. alternatively, you can run ```npx cap run ios``` ... select a simulator from the terminal + make changes locally, HMR should be enabled as well 🚀🎉
7. Do not commit the following, remove the ```server: { url: "http://10.6.17.241:3000" }``` config field from ```capacitor.config.ts``` when not developing this is for local development only (NOT PRODUCTION)!

(android)
`pnpm start-android`

## Testing
E2E tests are written using [Playwright](https://playwright.dev/), which may require some setup. 
Usually, this is as simple as running the following command:

```bash
npx playwright install
```

If you forgot to run it, you'll likely see an error asking you to. If that _still_ doesn't work, you
may need to install some system dependencies. See the Playwright docs [here](https://playwright.dev/docs/cli#install-browsers) for more info.

After playwright is set up, you can simply run `pnpm test` or `pnpm exec nx test learn-card-app` to run the E2E tests!

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Who is Learning Economy Foundation?

**[Learning Economy Foundation (LEF)](https://www.learningeconomy.io)** is a 501(c)(3) non-profit organization leveraging global standards and web3 protocols to bring quality skills and equal opportunity to every human on earth, and address the persistent inequities that exist around the globe in education and employment. We help you build the future of education and work with:


## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
