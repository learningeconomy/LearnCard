[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# MetaMask Snap Example Dapp

The LearnCard MetaMask Snap allows MetaMask users to view, issue, verify, present, and persist DIDs and Verifiable Credentials
via the LearnCard SDK. It allows dapps to use these methods without gaining access to the user's sensitive key material.
This is an example dapp built using [Astro](https://astro.build/) that demonstrates how to use the snap!

## Documentation
All LearnCard documentation can be found at:
https://app.gitbook.com/o/6uDv1QDlxaaZC7i8EaGb/s/FXvEJ9j3Vf3FW5Nc557n/

## Install

First clone the repo, then install all dependencies/build all packages

```bash
git clone git@github.com:WeLibraryOS/LearnCard.git
cd LearnCard
pnpm i
```

## Run the app

Then open two terminals and start the snap dev server, as well as this app's dev server

```bash
# Terminal 1
cd services/meta-mask-snap
pnpm dev
```

```bash
# Terminal 2
cd examples/snap-example-dapp
pnpm dev
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Who is Learning Economy Foundation?

**[Learning Economy Foundation (LEF)](https://www.learningeconomy.io)** is a 501(c)(3) non-profit organization leveraging global standards and web3 protocols to bring quality skills and equal opportunity to every human on earth, and address the persistent inequities that exist around the globe in education and employment. We help you build the future of education and work with:


## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
