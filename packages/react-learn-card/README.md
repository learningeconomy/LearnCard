[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/react

[![npm version](https://img.shields.io/npm/v/@learncard/react)](https://www.npmjs.com/package/@learncard/react)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/react)](https://www.npmjs.com/package/@learncard/react)
[![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@learncard/react)](https://www.npmjs.com/package/@learncard/react)

**LearnCard React** is dedicated set of **open-source**, **flexible**, and **reusable Storybook UX React components for credential and currency** built for the future of education and work.

![learn-card](https://user-images.githubusercontent.com/2185016/201373744-058bef30-dec8-46cf-9552-408b7bc43532.gif)

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

Docs for LearnCard React can be found at:
https://docs.learncard.com/learn-card-sdk/learncard-ux

## Install

```bash
bun install @learncard/react
```

## Usage

```ts
import React, { useState, useEffect } from 'react';
import '@learncard/react/dist/base.css'; // if not already using tailwind
import '@learncard/react/dist/main.css';
import { initLearnCard } from '@learncard/core';
import { VCCard } from '@learncard/react';
import { VC } from '@learncard/types';

const Test = () => {
    const [vc, setVc] = useState<VC | null>(null);

    useEffect(() => {
        const getVc = async () => {
            const wallet = await initLearnCard({ seed: 'a' }); // Bad practice! You should be generating keys...
            const uvc = wallet.invoke.getTestVc();
            setVc(await wallet.invoke.issueCredential(uvc));
        };

        getVc();
    }, []);

    if (!vc) return <>Generating Credential...</>; // Loading placeholder while credential is generated

    return <VCCard credential={vc} />; // Show card for the generated credential with validation results
};
```

### Styles

`@learncard/react` uses Tailwind 4.3 and exports two compiled stylesheets:
`main.css` contains component utilities and bespoke styles; optional `base.css`
applies the global reset. A host that already owns its reset should import only
`main.css`. Consumers do not need to run Tailwind themselves.

#### Migrating to the Tailwind 4 stylesheet release

This is a major package release because the CSS requires Safari/iOS 16.4+,
Chrome/Edge/Android WebView 111+, or Firefox 128+. Keep the previous major release
if older browsers must remain supported. No React component API change is required
to keep using the same stylesheet imports.

The card palette and font families compile to literal values, preserving the
previous package design without exporting `--color-*` tokens or inheriting host
Tailwind palette variables. Host token overrides alone do not recolor these
utilities. Utility class names remain global: a host rule for the same class can
still override the package through the usual CSS cascade, as before. Import the
styles in the intended order and review any deliberate host overrides.

For native consumers, enforce the actual WebView engine floor and provide an
update notice before sending this CSS to older clients. The monorepo apps use
separate Capgo channels and a static browser error page; release their matching
native builds before promoting OTA bundles.

#### If using Tailwind already

```ts
import '@learncard/react/dist/main.css';
```

#### If not using Tailwind already

```ts
import '@learncard/react/dist/base.css';
import '@learncard/react/dist/main.css';
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Who is Learning Economy Foundation?

**[Learning Economy Foundation (LEF)](https://www.learningeconomy.io)** is a 501(c)(3) non-profit organization leveraging global standards and web3 protocols to bring quality skills and equal opportunity to every human on earth, and address the persistent inequities that exist around the globe in education and employment. We help you build the future of education and work with:

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
