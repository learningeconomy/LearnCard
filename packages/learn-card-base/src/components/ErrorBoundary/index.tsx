import React from 'react';

import { isStaleChunkError, guardedChunkReload } from '../../helpers/lazyWithRetry';

type ErrorBoundaryProps = {
    children: React.ReactNode;
    FallbackComponent: React.ReactNode;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean }> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        // You can also log the error to an error reporting service
        console.error({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return this.props.FallbackComponent;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

export class ChunkBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(err: any) {
        if (isStaleChunkError(err)) {
            guardedChunkReload();
        }
    }

    render() {
        return this.state.hasError ? null : this.props.children;
    }
}
