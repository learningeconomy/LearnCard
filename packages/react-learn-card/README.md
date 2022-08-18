[<img src="https://user-images.githubusercontent.com/2185016/176284693-4ca14052-d067-4ea5-b170-c6cd2594ee23.png" width="400"/>](image.png)
# @learncard/react

[![npm version](https://img.shields.io/npm/v/@learncard/react)](https://www.npmjs.com/package/@learncard/react)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/react)](https://www.npmjs.com/package/@learncard/react)
[![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@learncard/react)](https://www.npmjs.com/package/@learncard/react)

**LearnCard React** is dedicated set of **open-source**, **flexible**, and **reusable Storybook UX React components for credential and currency** built for the future of education and work.

## Documentation
All LearnCard documentation can be found at:
https://app.gitbook.com/o/6uDv1QDlxaaZC7i8EaGb/s/FXvEJ9j3Vf3FW5Nc557n/


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
            const wallet = await initLearnCard({ seed: 'a' }); // Bad practice! You should be generating keys...
            const uvc = wallet.getTestVc();
            setVc(await wallet.issueCredential(uvc));
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

