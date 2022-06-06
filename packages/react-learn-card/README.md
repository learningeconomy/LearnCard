# @learncard/react

[![npm version](https://img.shields.io/npm/v/@learncard/react)](https://www.npmjs.com/package/@learncard/react)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/react)](https://www.npmjs.com/package/@learncard/react)
[![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@learncard/react)](https://www.npmjs.com/package/@learncard/react)

## Install

```bash
pnpm install @learncard/react
```

## Usage

```js
import React, { useState, useEffect } from "react";
import { walletFromKey } from "@learncard/core";
import { VCCard } from "@learncard/react";
import { VC } from "@learncard/types";

const Test = () => {
    const [vc, setVc] = useState<VC | null>(null);
    
    useEffect(() => {
        const getVc = async () => {
            const wallet = await walletFromKey(''); // Bad practice! You should be generating keys...
            const uvc = wallet.getTestVc();
            setVc(await wallet.issueCredential(uvc));
        };
        
        getVc();
    }, []);
    
    if (!vc) return <>Generating Credential...</>; // Loading placeholder while credential is generated
    
    return <VCCard credential={vc} />; // Show card for the generated credential with validation results
};
```

## Docs

Read the official docs [here](https://app.gitbook.com/o/6uDv1QDlxaaZC7i8EaGb/s/LRHp8IUs5bJdshkB3Sbs/)!

## License

MIT © [Taylor Beeston <beeston.taylor@gmail.com>](https://github.com/TaylorBeeston)
