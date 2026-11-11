import React from 'react';
import { Streamdown } from 'streamdown';
import { createCodePlugin } from '@streamdown/code';
import { math } from '@streamdown/math';

import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
    children?: string | null;
}

const codePlugin = createCodePlugin({ themes: ['dracula', 'dracula'] });

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for this lint-only PR
    return <Streamdown plugins={{ code: codePlugin as any, math }}>{children ?? ''}</Streamdown>;
};

export default MarkdownRenderer;
