---
id: "index"
title: "@learncard/react"
sidebar_label: "Readme"
sidebar_position: 0
custom_edit_url: null
---

[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/react

[![npm version](https://img.shields.io/npm/v/@learncard/react)](https://www.npmjs.com/package/@learncard/react)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/react)](https://www.npmjs.com/package/@learncard/react)
[![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@learncard/react)](https://www.npmjs.com/package/@learncard/react)

**LearnCard React** is dedicated set of **open-source**, **flexible**, and **reusable Storybook UX React components for credential and currency** built for the future of education and work.

## Documentation
All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
pnpm install @learncard/react
```

## Usage

```ts
import React, { useState, useEffect } from "react";
import '@learncard/react/dist/base.css'; // if not already using tailwind
import '@learncard/react/dist/main.css';
import { initLearnCard } from "@learncard/core";
import { VCCard } from "@learncard/react";
import { VC } from "@learncard/types";

const Test = () => {
    const [vc, setVc] = useState<VC | null>(null);
    
    useEffect(() => {
        const getVc = async () => {
            // Generate a valid seed - must be 64 characters
            const wallet = await initLearnCard({ seed: 'a'.repeat(64) });
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

`@learncard/react` uses [tailwind](https://tailwindcss.com/) for styles, and exports two css files
for consumers: `base.css` and `main.css`. If you are already using Tailwind, you do not need to import
`base.css`, as it is simply re-exposing `@tailwind base` and `@tailwindcss/components`. However, you
_will_ need to import `main.css`, because it imports the tailwind classes used by our components, as
well as our bespoke CSS classes.

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
