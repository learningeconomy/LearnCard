import { Profile } from './Profile';
import { Credential } from './Credential';

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
});

export * from './Profile';
export * from './Credential';
