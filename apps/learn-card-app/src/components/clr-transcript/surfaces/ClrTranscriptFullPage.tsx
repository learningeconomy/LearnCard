import React from 'react';
import { ClrRenderer } from '../../clr-renderer/ClrRenderer';
import type { ClrRendererProps } from '../../clr-renderer/types';
import { ClrTranscriptSurface } from 'learn-card-base/helpers/credentials/clr/renderer';
export { createClrRecordNavigator } from '../../clr-renderer/recordNavigation';

/** Compatibility entry point: every CLR now uses the common layout decision. */
const ClrTranscriptFullPage = (props: ClrRendererProps) => (
    <ClrRenderer {...props} options={{ ...props.options, surface: ClrTranscriptSurface.Full }} />
);
export default ClrTranscriptFullPage;
