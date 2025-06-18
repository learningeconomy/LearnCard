import type { DynamicLoaderPluginType } from './types';

export * from './types';

/**
 * @group Plugins
 */
export const DynamicLoaderPlugin: DynamicLoaderPluginType = {
    name: 'Dynamic Loader',
    displayName: 'Dynamic Loader',
    description: 'Resolve JSON-LD Contexts dynamically via fetch',
    context: {
        resolveStaticDocument: async () => undefined,
        resolveRemoteDocument: async (_learnCard, uri) => {
            try {
                const response = await fetch(uri);

                if (response.status !== 200) throw new Error('Status Code not 200!');

                return await response.json();
            } catch (error) {
                _learnCard.debug?.('Error fetching remote context!', error);

                return undefined;
            }
        },
    },
    methods: {},
};
