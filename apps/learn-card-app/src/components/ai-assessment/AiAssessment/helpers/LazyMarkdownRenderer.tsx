import React, { Suspense } from 'react';

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
    <Suspense fallback={<div className="animate-pulse text-gray-400">Rendering…</div>}>
        <LazyMarkdownRenderer>{children}</LazyMarkdownRenderer>
    </Suspense>
);

export default LazyMarkdownRendererWrapper;
