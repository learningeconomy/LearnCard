import { describe, expect, it } from 'vitest';

import { insertParamsToFilestackUrl } from '../filestack.helpers';

describe('filestack helpers', () => {
    it('inserts params into standard Filestack CDN URLs', () => {
        expect(
            insertParamsToFilestackUrl('https://cdn.filestackcontent.com/abc', 'resize=width:100/')
        ).toBe('https://cdn.filestackcontent.com/resize=width:100/abc');
    });

    it('returns undefined URLs unchanged', () => {
        expect(insertParamsToFilestackUrl(undefined, 'resize=width:100/')).toBeUndefined();
    });
});
