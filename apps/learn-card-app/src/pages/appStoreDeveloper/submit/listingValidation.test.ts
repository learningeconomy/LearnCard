import { describe, expect, it } from 'vitest';

import { DEFAULT_APP_ICON_URL } from './constants';
import { getFirstMissingField, getProductionUrlError } from './listingValidation';

const complete = {
    name: 'Quiz Quest',
    tagline: 'Learn by playing',
    description: 'Answer questions and earn badges.',
    iconUrl: 'https://cdn.filestackcontent.com/icon',
    needsProductionUrl: false,
    productionUrl: '',
};

describe('getFirstMissingField', () => {
    it('allows a complete listing', () => {
        expect(getFirstMissingField(complete)).toBeNull();
    });

    it('reports fields in the order they appear on screen', () => {
        expect(getFirstMissingField({ ...complete, iconUrl: '', name: '' })?.field).toBe('icon');
        expect(getFirstMissingField({ ...complete, name: ' ', tagline: '' })?.field).toBe('name');
        expect(getFirstMissingField({ ...complete, tagline: '', description: '' })?.field).toBe(
            'tagline'
        );
        expect(getFirstMissingField({ ...complete, description: '' })).toEqual({
            field: 'description',
            message: 'Add a description to submit',
        });
    });

    it('treats the default icon as missing', () => {
        expect(getFirstMissingField({ ...complete, iconUrl: DEFAULT_APP_ICON_URL })?.field).toBe(
            'icon'
        );
    });

    it('only asks where the app will live for local or preview addresses', () => {
        expect(getFirstMissingField({ ...complete, needsProductionUrl: true })?.field).toBe(
            'productionUrl'
        );
        expect(
            getFirstMissingField({
                ...complete,
                needsProductionUrl: true,
                productionUrl: 'https://quizquest.app',
            })
        ).toBeNull();
    });

    it('blocks an invalid contact email but not an empty one', () => {
        expect(getFirstMissingField({ ...complete, contactEmail: 'nope' })?.field).toBe(
            'contactEmail'
        );
        expect(getFirstMissingField({ ...complete, contactEmail: '' })).toBeNull();
    });
});

describe('getProductionUrlError', () => {
    it('accepts an https domain', () => {
        expect(getProductionUrlError('https://quizquest.app')).toBeNull();
        expect(getProductionUrlError('https://quizquest.app/')).toBeNull();
    });

    it('rejects http, paths, and non-addresses', () => {
        expect(getProductionUrlError('http://quizquest.app')).toMatch(/https/);
        expect(getProductionUrlError('https://quizquest.app/play')).toMatch(/just the domain/);
        expect(getProductionUrlError('quizquest')).toMatch(/full address/);
    });
});
