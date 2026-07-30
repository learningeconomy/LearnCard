import { UnsignedVCValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const vcV2RenderMethodExample: CredentialFixture = {
    id: 'vc-v2/render-method-example',
    name: 'VC v2 Render Method Example',
    description: 'Minimal VC v2 example that demonstrates top-level renderMethod support.',
    spec: 'vc-v2',
    profile: 'generic',
    features: [],
    source: 'spec-example',
    signed: false,
    validity: 'valid',
    tags: ['render-method', 'svg-mustache', 'template'],
    validator: UnsignedVCValidator,

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://digitalbazaar.github.io/vc-render-method-context/contexts/v2rc2.jsonld',
        ],
        id: 'urn:uuid:99fc4030-3d05-4619-9e0e-46d0f711ccc9',
        type: ['VerifiableCredential'],
        issuer: {
            id: 'did:example:issuer123',
            name: 'Example Issuer',
        },
        name: 'Render Method Example',
        description: 'A minimal VC v2 example for SVG Mustache rendering.',
        validFrom: '2024-07-01T00:00:00Z',
        credentialSubject: {
            id: 'did:example:subject456',
            name: 'Example Subject',
        },
        renderMethod: {
            type: 'TemplateRenderMethod',
            renderSuite: 'svg-mustache',
            template: 'https://templates.learncard.com/svg/card/card-1.0.0.svg',
            outputPreference: {
                mediaType: 'image/svg+xml',
            },
        },
    },
};
