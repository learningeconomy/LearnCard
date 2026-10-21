import { ModelFactory, NeogmaInstance } from 'neogma';
import { neogma } from '@instance';

type Properties = { id: string; name: string; issuer: string; image?: string };
export type CredentialSharePreviewInstance = NeogmaInstance<Properties, Record<string, never>>;

export const CredentialSharePreview = ModelFactory<Properties, Record<string, never>>(
    {
        label: 'CredentialSharePreview',
        primaryKeyField: 'id',
        schema: {
            id: { type: 'string', required: true },
            name: { type: 'string', required: true },
            issuer: { type: 'string', required: true },
            image: { type: 'string', required: false },
        },
    },
    neogma
);
