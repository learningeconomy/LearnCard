import React, { useEffect, useState } from 'react';

import { VC, TemplateRenderMethod } from '@learncard/types';
import { renderSvgMustache } from '../../helpers/renderMethod.helpers';

type RenderState =
    | { status: 'loading' }
    | { status: 'success'; svg: string }
    | { status: 'error'; error: unknown };

type RenderMethodDisplayProps = {
    vc: VC;
    renderMethod: TemplateRenderMethod;
    fallback: React.ReactNode;
    className?: string;
};

export const RenderMethodDisplay: React.FC<RenderMethodDisplayProps> = ({
    vc,
    renderMethod,
    fallback,
    className,
}) => {
    const [state, setState] = useState<RenderState>({ status: 'loading' });

    useEffect(() => {
        let cancelled = false;

        setState({ status: 'loading' });

        renderSvgMustache(vc, renderMethod)
            .then(svg => {
                if (!cancelled) setState({ status: 'success', svg });
            })
            .catch(error => {
                if (!cancelled) setState({ status: 'error', error });
            });

        return () => {
            cancelled = true;
        };
    }, [vc?.id, renderMethod?.template, renderMethod?.renderSuite]);

    if (state.status === 'error') return <>{fallback}</>;

    if (state.status === 'loading') {
        return (
            <div
                className={className}
                style={{
                    width: '100%',
                    aspectRatio: '640 / 400',
                    borderRadius: '28px',
                    background: 'linear-gradient(135deg, #121423 0%, #1e2240 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        border: '3px solid #6366f1',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div
            className={className}
            style={{
                width: '100%',
                overflow: 'hidden',
                borderRadius: '28px',
                pointerEvents: 'none',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                dangerouslySetInnerHTML={{ __html: state.svg }}
            />
        </div>
    );
};

export default RenderMethodDisplay;
