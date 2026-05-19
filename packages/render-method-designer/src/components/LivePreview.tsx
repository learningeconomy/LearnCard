import React, { useMemo } from 'react';

import type { RenderData, SuiteAdapter } from '../types';

export interface LivePreviewProps {
    template: string;
    data: RenderData;
    adapter: SuiteAdapter;
    /** When true, render errors are caught and surfaced as an inline message instead of crashing. */
    onError?: (error: Error) => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ template, data, adapter, onError }) => {
    const html = useMemo(() => {
        try {
            return adapter.render(template, data);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (onError && err instanceof Error) onError(err);
            return `<!-- Render error: ${message.replace(/-->/g, '--')} -->`;
        }
    }, [template, data, adapter, onError]);

    return (
        <div
            className="render-method-designer__preview"
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FBFBFC',
                overflow: 'auto',
                padding: '24px',
            }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};
