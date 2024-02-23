import { Boost } from './Boost';
import { Profile } from './Profile';
import { Credential } from './Credential';
import { Presentation } from './Presentation';
import { ConsentFlow } from './ConsentFlow';

Profile.addRelationships({ adminOf: { model: Boost, direction: 'out', name: 'ADMIN_OF' } });

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
export * from './ConsentFlow';
