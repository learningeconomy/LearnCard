import React, { Suspense } from 'react';

const LazyMarkdownRenderer = React.lazy(() => import('./MarkdownRenderer'));

interface MarkdownRendererProps {
    children?: string | null;
}

const LazyMarkdownRendererWrapper: React.FC<MarkdownRendererProps> = ({ children }) => (
    <Suspense fallback={<div className="animate-pulse text-gray-400">Rendering…</div>}>
        <LazyMarkdownRenderer>{children}</LazyMarkdownRenderer>
    </Suspense>
);

export default LazyMarkdownRendererWrapper;
