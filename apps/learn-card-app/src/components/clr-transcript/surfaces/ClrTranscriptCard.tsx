import React from 'react';
import { ClrRenderer } from '../../clr-renderer/ClrRenderer';
import type { ClrRendererProps } from '../../clr-renderer/types';
import { ClrTranscriptSurface } from 'learn-card-base/helpers/credentials/clr/renderer';
const ClrTranscriptCard = (
    props: Omit<ClrRendererProps, 'options'> & Partial<Pick<ClrRendererProps, 'options'>>
) => (
    <ClrRenderer
        {...props}
        options={{ viewer: 'student', ...props.options, surface: ClrTranscriptSurface.Card }}
    />
);
export default ClrTranscriptCard;
