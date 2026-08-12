import { describe, expect, it } from 'vitest';

import { deepMerge } from '../deepMerge';

describe('deepMerge', () => {
    it('replaces storage config when the provider changes', () => {
        const result = deepMerge(
            {
                storage: {
                    provider: 'filestack',
                    apiKey: 'learncard-key',
                    cdnDomain: 'cdn.filestackcontent.com',
                    apiDomain: 'www.filestackapi.com',
                },
            },
            {
                storage: {
                    provider: 's3',
                    uploadEndpoint: 'https://uploads.example.com/images',
                    cdnDomain: 'cdn.mytenant.app',
                },
            }
        );

        expect(result.storage).toEqual({
            provider: 's3',
            uploadEndpoint: 'https://uploads.example.com/images',
            cdnDomain: 'cdn.mytenant.app',
        });
    });

    it('deep-merges storage config when the provider does not change', () => {
        const result = deepMerge(
            {
                storage: {
                    provider: 'filestack',
                    apiKey: 'learncard-key',
                    cdnDomain: 'cdn.filestackcontent.com',
                    apiDomain: 'www.filestackapi.com',
                },
            },
            {
                storage: {
                    provider: 'filestack',
                    cdnDomain: 'cdn.example.com',
                },
            }
        );

        expect(result.storage).toEqual({
            provider: 'filestack',
            apiKey: 'learncard-key',
            cdnDomain: 'cdn.example.com',
            apiDomain: 'www.filestackapi.com',
        });
    });
});
