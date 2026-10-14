import { isAppBuilderEditorOrigin, isAppBuilderPreviewHost } from '../app-builders';

describe('isAppBuilderPreviewHost', () => {
    it.each([
        'abc123.lovableproject.com',
        'id-preview--0f3c-41a2.lovable.app',
        'k8s-xyz.local-credentialless.webcontainer-api.io',
        'zp1v56uxy8rdx5ypatb0ockcb9tr6a.webcontainer-api.io',
        '8f2c-uuid.picard.replit.dev',
        'kzmi5x3.vusercontent.net',
        'ABC.LOVABLEPROJECT.COM',
    ])('treats %s as a preview host', hostname => {
        expect(isAppBuilderPreviewHost(hostname)).toBe(true);
    });

    it.each([
        'my-app.lovable.app',
        'my-app.vercel.app',
        'my-app.replit.app',
        'my-app.bolt.host',
        'my-app.csb.app',
        'my-app.netlify.app',
        'lovableproject.com.evil.com',
        'example.com',
    ])('treats published host %s as real', hostname => {
        expect(isAppBuilderPreviewHost(hostname)).toBe(false);
    });
});

describe('isAppBuilderEditorOrigin', () => {
    it.each([
        'https://lovable.dev',
        'https://www.lovable.dev',
        'https://bolt.new',
        'https://stackblitz.com',
        'https://v0.dev',
        'https://v0.app',
        'https://replit.com',
    ])('recognizes the %s editor', origin => {
        expect(isAppBuilderEditorOrigin(origin)).toBe(true);
    });

    it.each([
        'http://lovable.dev',
        'https://lovable.dev.evil.com',
        'https://evil-lovable.dev',
        'https://learncard.app',
        'not a url',
    ])('rejects %s', origin => {
        expect(isAppBuilderEditorOrigin(origin)).toBe(false);
    });
});
