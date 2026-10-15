import { expect, test } from 'bun:test';
import { nativeProfileUpdate } from './profile-update';

test('name and bio edits omit image so an existing photo is preserved', () => {
    const update = nativeProfileUpdate({ name: ' Person ', bio: ' About me ' });
    expect(update).toEqual({ displayName: 'Person', bio: 'About me' });
    expect(Object.hasOwn(update, 'image')).toBe(false);
});
test('removal clears the same image field as the web profile editor', () => {
    expect(nativeProfileUpdate({ name: 'Person', bio: '', image: '' }).image).toBe('');
});
test('replacement accepts the configured image provider without changing other fields', () => {
    const image = 'https://cdn.filestackcontent.com/synthetic-photo';
    expect(nativeProfileUpdate({ name: 'Person', bio: '', image })).toEqual({
        displayName: 'Person',
        bio: '',
        image,
    });
});
test('refuses local, unsafe and other-provider photo references', () => {
    for (const image of [
        'file:///tmp/photo.jpg',
        'data:image/png;base64,AAAA',
        'http://cdn.filestackcontent.com/p',
        'https://cdn.filestackcontent.com.evil.test/p',
        'https://user:pass@cdn.filestackcontent.com/p',
        'https://cdn.filestackcontent.com:1234/p',
        'https://cdn.filestackcontent.com/',
        'invalid',
        'x'.repeat(2049),
    ]) {
        expect(() => nativeProfileUpdate({ name: 'Person', bio: '', image })).toThrow();
    }
});
test('invalid profile values fail before any mutation', () => {
    for (const input of [
        { name: ' ', bio: '' },
        { name: 'x'.repeat(101), bio: '' },
        { name: 'Person', bio: 'x'.repeat(501) },
    ]) {
        expect(() => nativeProfileUpdate(input)).toThrow();
    }
});
