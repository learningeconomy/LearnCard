import { Boost } from './Boost';
import { Profile } from './Profile';
import { Credential } from './Credential';
import { Presentation } from './Presentation';

Credential.addRelationships({
    credentialReceived: {
        model: Profile,
        direction: 'out',
        name: 'CREDENTIAL_RECEIVED',
        properties: {
            from: { property: 'from', schema: { type: 'string', required: true } },
            date: { property: 'date', schema: { type: 'string', required: true } },
        },
    },
    instanceOf: {
        model: Boost,
        direction: 'out',
        name: 'INSTANCE_OF',
    },
});

Presentation.addRelationships({
    presentationReceived: {
        model: Profile,
        direction: 'out',
        name: 'PRESENTATION_RECEIVED',
        properties: {
            from: { property: 'from', schema: { type: 'string', required: true } },
            date: { property: 'date', schema: { type: 'string', required: true } },
        },
    },
});

export * from './Boost';
export * from './Profile';
export * from './Credential';
export * from './Presentation';
export * from './SigningAuthority';
export * from './ConsentFlowTerms';
export * from './ConsentFlowContract';
export * from './ConsentFlowTransaction';
