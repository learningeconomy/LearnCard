import { readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { nativeSignInFiles } from './native-sign-in-config';

// Public registration only; mobile builds must never contain provider secrets.
const root = resolve(import.meta.dir, '..');
const source = process.env.LC_NATIVE_OAUTH_CONFIG || resolve(root, 'oauth-config.json');
const files = nativeSignInFiles(JSON.parse(await readFile(source, 'utf8')));
const pushPlist = process.env.LC_NATIVE_PUSH_FIREBASE_PLIST;
const apnsEnvironment = process.env.LC_NATIVE_APNS_ENVIRONMENT ?? '';
const pushResource = resolve(root, 'ios/Sources/NativeCredentialPushConfig.json');

if (pushPlist || apnsEnvironment) {
    if (!pushPlist || !['development', 'production'].includes(apnsEnvironment)) {
        throw new Error(
            'Native push requires the Lab Firebase plist and a development or production APNs environment'
        );
    }
    const registration = JSON.parse(
        await readFile(resolve(root, 'firebase-registration.json'), 'utf8')
    );
    const converted = Bun.spawnSync(['plutil', '-convert', 'json', '-o', '-', resolve(pushPlist)]);
    if (converted.exitCode !== 0) throw new Error('Unable to parse the Lab Firebase plist');
    const plist = JSON.parse(converted.stdout.toString());
    if (
        plist.BUNDLE_ID !== registration.bundleID ||
        plist.PROJECT_ID !== registration.projectID ||
        plist.GCM_SENDER_ID !== registration.projectNumber ||
        plist.GOOGLE_APP_ID !== registration.firebaseAppID ||
        typeof plist.API_KEY !== 'string' ||
        !/^AIza[0-9A-Za-z_-]{35}$/.test(plist.API_KEY)
    ) {
        throw new Error(
            'Use the public Firebase plist for the registered LearnCard Native Lab iOS app'
        );
    }
    // Copy only fields required by Firebase Messaging. Never copy the supplied file wholesale.
    await writeFile(
        pushResource,
        JSON.stringify({
            bundleID: plist.BUNDLE_ID,
            projectID: plist.PROJECT_ID,
            senderID: plist.GCM_SENDER_ID,
            appID: plist.GOOGLE_APP_ID,
            apiKey: plist.API_KEY,
        })
    );
} else {
    await rm(pushResource, { force: true });
}

await writeFile(
    resolve(root, 'ios/NativeCore/Sources/LearnCardNativeSDK/Resources/native-oauth.json'),
    files.resource
);
await writeFile(
    resolve(root, 'ios/GeneratedOAuth.xcconfig'),
    `${files.xcconfig}LC_NATIVE_APNS_ENVIRONMENT = ${apnsEnvironment}\n`
);
await writeFile(
    resolve(root, 'ios/GeneratedOAuth.entitlements'),
    apnsEnvironment
        ? files.entitlements.replace(
              '</dict>',
              `<key>aps-environment</key><string>${apnsEnvironment}</string></dict>`
          )
        : files.entitlements
);
