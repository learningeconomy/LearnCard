[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# LearnCard SDK
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![Release Branch](https://img.shields.io/badge/release_branch-main-green.svg)](https://github.com/learningeconomy/LearnCard/tree/main)
[![Development Branch](https://img.shields.io/badge/docs-quickstart-green.svg)](https://docs.learncard.com/)
[![License](https://img.shields.io/badge/license-mit-blue.svg)](https://github.com/learningeconomy/LearnCard/blob/main/LICENSE)

The LearnCard SDK is an open-source digital wallet, ID, credentialing technology, and UX to enable any individual or organization to seamlessly **issue, earn, store, share, and spend currency and credentials.**

## Documentation
All LearnCard documentation can be found at:
https://docs.learncard.com

## About
The SDK is built on the [W3C Universal Wallet (UW)](https://w3c-ccg.github.io/universal-wallet-interop-spec/), a packaging of draft standards and open source frameworks incubated by MIT DCC, Transmute, Learning Economy Foundation. The UW includes key management and key rotation capabilities, [Verifiable Credentials (VCs)](https://www.w3.org/TR/vc-data-model/), [Decentralized Identifiers (DIDs)](https://github.com/w3c-ccg/did-spec), [Decentralized Web Nodes (DWN)](https://identity.foundation/decentralized-web-node/spec/), and a trust triangle that operates modularly on [IPFS](https://ipfs.io/) with plug-ins for any layer 1 or layer 2 blockchain.  

The LearnCard is a key primitive in the architecture for a [global network of learner wallets](https://github.com/Learning-Economy-Foundation/Protocol-Research/blob/main/IoE-Network.md), published by Learning Economy Foundation

## Packages
- [LearnCard Core](./packages/learn-card-core) – a pluggable, wallet for issuing, receiving, storing, sharing, and spending currency and credentials.
- [LearnCard React](./packages/react-learn-card) – dedicated set of flexible and reusable Storybook UX components for credential and currency visualization and interactions.
- [LearnCard Bridge - HTTP](./packages/learn-card-bridge-http) – simple CLI and CloudFormation IaC to easily spin up a dedicated execution environment for LearnCard Core exposed over an HTTP API.
- [LearnCard CLI](./packages/learn-card-cli) - an easy to use node REPL; instantiates a LearnCard + all the tools you need to easily play around with the LearnCard SDK.
- LearnCard DWN - Decentralized Web Nodes as a service for storing and retrieving credentials.
- LearnCard App - iOS, Android, and Web implementation of LearnCard Core & UX; customizable, whitelabel-able, and modular to support pathways and communities.

## Services
- [LearnCard Discord Bot](./services/learn-card-discord-bot) - Discord bot for issuing and verifying Verifiable Credentials in your community.
- [MetaMask Snap](./services/meta-mask-snap) - view, issue, verify, present, and persist DIDs and Verifiable Credentials in MetaMask via the LearnCard SDK to enable dApps to use DIDs & VC without gaining access to the user's sensitive key material.

## Installation

Use the package manager [pnpm](https://pnpm.io/) to install LearnCard.

```bash
pnpm install
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

[![Stargazers repo roster for @learningeconomy/LearnCard](https://reporoster.com/stars/learningeconomy/LearnCard)](https://github.com/learningeconomy/LearnCard/stargazers)

## Comments, Questions, or Palpitations of the Heart?
The best way to start engaging in the community is to participate in our Github Discussions: 
- [Post a Feature Request 💡](https://github.com/learningeconomy/LearnCard/discussions/categories/feature-requests)
- [Ask for Help 💖](https://github.com/learningeconomy/LearnCard/discussions/categories/help)
- [Show off your project to the community! 🙌](https://github.com/learningeconomy/LearnCard/discussions/categories/show-and-tell)

## Who is Learning Economy Foundation?

**[Learning Economy Foundation (LEF)](https://www.learningeconomy.io)** is a 501(c)(3) non-profit organization leveraging global standards and web3 protocols to bring quality skills and equal opportunity to every human on earth, and address the persistent inequities that exist around the globe in education and employment. 


## License
MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
