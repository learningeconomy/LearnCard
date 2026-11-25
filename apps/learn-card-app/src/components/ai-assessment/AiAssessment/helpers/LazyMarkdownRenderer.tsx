import React, { Suspense } from 'react';
import * as m from '../../../../paraglide/messages.js';

const importMarkdownRenderer = () => import('./MarkdownRenderer');

const LazyMarkdownRenderer = React.lazy(importMarkdownRenderer);

// Eagerly fetch the chunk so the first streamed assistant token doesn't flash
// the Suspense fallback. Safe to call multiple times — the dynamic import is
// memoized by the bundler.
export const preloadMarkdownRenderer = () => {
    void importMarkdownRenderer();
};

interface MarkdownRendererProps {
    children?: string | null;
}

const LazyMarkdownRendererWrapper: React.FC<MarkdownRendererProps> = ({ children }) => (
    <Suspense
        fallback={
            <div className="animate-pulse text-grayscale-600" role="status">
                {m['common.loading']()}
            </div>
        }
    >
        <LazyMarkdownRenderer>{children}</LazyMarkdownRenderer>
    </Suspense>
);

export default LazyMarkdownRendererWrapper;
