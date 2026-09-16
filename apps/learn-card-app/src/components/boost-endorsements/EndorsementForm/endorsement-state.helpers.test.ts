import { describe, expect, it } from 'vitest';

import {
    convertAttachmentsToEvidence,
    EndorsementMediaOptionsEnum,
} from './endorsement-state.helpers';

describe('convertAttachmentsToEvidence', () => {
    it('serializes uploaded media as standard OBv3 Evidence', () => {
        expect(
            convertAttachmentsToEvidence([
                {
                    title: 'Project photo',
                    fileName: 'project.png',
                    fileSize: '24 kB',
                    fileType: 'image/png',
                    url: 'https://example.com/project.png',
                    type: EndorsementMediaOptionsEnum.photo,
                },
            ])
        ).toEqual([
            {
                id: 'https://example.com/project.png',
                type: ['Evidence'],
                name: 'Project photo',
                genre: EndorsementMediaOptionsEnum.photo,
            },
        ]);
    });
});
