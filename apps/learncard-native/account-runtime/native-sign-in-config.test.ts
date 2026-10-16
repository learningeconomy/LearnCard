import { expect, test } from 'bun:test';
import { nativeSignInFiles } from '../scripts/native-sign-in-config';
import config from '../oauth-config.json';

test('unregistered native providers stay disabled without entitlements or a borrowed client', () => {
    const files = nativeSignInFiles(config);
    expect(JSON.parse(files.resource)).toEqual({
        bundleID: config.bundleID,
        appleEnabled: false,
        googleClientID: null,
    });
    expect(files.entitlements).not.toContain('applesignin');
    expect(files.xcconfig).toContain('learncard-native-google-unconfigured');
});
test('registered providers produce a matching callback and Apple signing configuration', () => {
    const files = nativeSignInFiles({
        ...config,
        googleClientID: '776298253175-synthetic.apps.googleusercontent.com',
        appleEnabled: true,
        appleTeamID: 'ABC123DE45',
        appleWebIdentityGrouped: true,
    });
    expect(files.xcconfig).toContain(
        'LC_NATIVE_GOOGLE_SCHEME = com.googleusercontent.apps.776298253175-synthetic'
    );
    expect(files.xcconfig).toContain('DEVELOPMENT_TEAM = ABC123DE45');
    expect(files.entitlements).toContain('com.apple.developer.applesignin');
    expect(JSON.parse(files.resource)).not.toHaveProperty('appleTeamID');
});
test('mobile registration rejects secrets, foreign bundles and foreign projects', () => {
    for (const patch of [
        { clientSecret: 'synthetic' },
        { applePrivateKey: 'synthetic' },
        { bundleID: 'com.learncard.app' },
        { googleClientID: '123-foreign.apps.googleusercontent.com' },
        { googleClientID: '776298253175-client\nINJECTED = YES.apps.googleusercontent.com' },
    ]) {
        expect(() => nativeSignInFiles({ ...config, ...patch })).toThrow();
    }
});
test('Apple cannot be enabled until identity grouping and the signing team are explicit', () => {
    for (const patch of [
        {},
        { appleTeamID: 'ABC123DE45' },
        { appleTeamID: 'wrong', appleWebIdentityGrouped: true },
    ]) {
        expect(() => nativeSignInFiles({ ...config, appleEnabled: true, ...patch })).toThrow();
    }
});
