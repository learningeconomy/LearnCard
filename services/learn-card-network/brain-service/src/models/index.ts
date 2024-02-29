import { Boost } from './Boost';
import { Profile } from './Profile';
import { Credential } from './Credential';
import { Presentation } from './Presentation';
import { ConsentFlowContract } from './ConsentFlowContract';

Profile.addRelationships({
    adminOf: { model: Boost, direction: 'out', name: 'ADMIN_OF' },
    consentsTo: {
        model: ConsentFlowContract,
        direction: 'out',
        name: 'CONSENTS_TO',
        properties: {
            id: { property: 'id', schema: { type: 'string', required: true } },
            terms: { property: 'terms', schema: { type: 'string', required: true } },
            createdAt: { property: 'createdAt', schema: { type: 'string', required: true } },
            updatedAt: { property: 'updatedAt', schema: { type: 'string', required: true } },
        },
    },
});

Credential.addRelationships({
    credentialReceived: {
        model: Profile,
        direction: 'out',
        name: 'CREDENTIAL_RECEIVED',
        properties: {
            from: { property: 'from', schema: { type: 'string' } },
            date: { property: 'date', schema: { type: 'string' } },
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
            from: { property: 'from', schema: { type: 'string' } },
            date: { property: 'date', schema: { type: 'string' } },
        },
    },
});

export * from './Boost';
export * from './Profile';
export * from './Credential';
export * from './Presentation';
export * from './SigningAuthority';
export * from './ConsentFlowContract';
