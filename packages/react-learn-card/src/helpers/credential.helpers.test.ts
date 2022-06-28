import { Image } from '@learncard/types';
import { getImageFromImage, getNameFromProfile, getImageFromProfile } from './credential.helpers';

describe('Credential Helpers', () => {
    describe('getImageFromImage', () => {
        it('correctly gets simple images', () => {
            expect(getImageFromImage('nice')).toEqual('nice');
        });

        it('correctly gets complex images', () => {
            expect(getImageFromImage({ id: 'nice', type: 'image' })).toEqual('nice');
        });

        it('returns an empty string if image is missing id', () => {
            expect(getImageFromImage({ type: 'image' } as Image)).toEqual('');
        });
    });

    describe('getNameFromProfile', () => {
        it('correctly gets simple names', () => {
            expect(getNameFromProfile('nice')).toEqual('nice');
        });

        it('correctly gets complex names', () => {
            expect(getNameFromProfile({ name: 'nice' })).toEqual('nice');
        });

        it('returns an empty string if profile is missing name', () => {
            expect(getNameFromProfile({ url: 'nice' })).toEqual('');
        });
    });

    describe('getImageFromProfile', () => {
        it('correctly gets simple names', () => {
            expect(getImageFromProfile({ image: 'nice' })).toEqual('nice');
        });

        it('correctly gets complex names', () => {
            expect(getImageFromProfile({ image: { id: 'nice', type: 'image' } })).toEqual('nice');
        });

        it('returns an empty string if profile is a string', () => {
            expect(getImageFromProfile('nice')).toEqual('');
        });

        it('returns an empty string if profile image is missing id', () => {
            expect(getImageFromProfile({ image: { type: 'image' } as Image })).toEqual('');
        });
    });
});
