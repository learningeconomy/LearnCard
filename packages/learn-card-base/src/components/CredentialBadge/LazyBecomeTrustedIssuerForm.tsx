import React from 'react';

import { lazyWithRetry } from '../../helpers/lazyWithRetry';
import type { BecomeTrustedIssuerFormProps } from './BecomeTrustedIssuerForm';

// The form embeds Typeform (~70 KB); load it when the user opens it.
const LazyForm = lazyWithRetry(() => import('./BecomeTrustedIssuerForm'));

const LazyBecomeTrustedIssuerForm: React.FC<BecomeTrustedIssuerFormProps> = props => (
    <React.Suspense fallback={null}>
        <LazyForm {...props} />
    </React.Suspense>
);

export default LazyBecomeTrustedIssuerForm;
