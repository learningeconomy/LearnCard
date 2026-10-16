/** Public iOS registration only. Never accept a provider secret in a mobile build. */
export const nativeSignInFiles = (
    input: unknown
): { resource: string; xcconfig: string; entitlements: string } => {
    if (!input || typeof input !== 'object' || Array.isArray(input))
        throw new Error('Invalid native sign-in configuration');
    const config = input as Record<string, unknown>;
    const keys = [
        'bundleID',
        'appleEnabled',
        'appleTeamID',
        'appleWebIdentityGrouped',
        'googleClientID',
    ];
    if (Object.keys(config).some(key => !keys.includes(key)))
        throw new Error('Unknown native sign-in configuration field');
    if (config.bundleID !== 'org.learningeconomy.learncard.native.experiment')
        throw new Error('Native OAuth registration must match the Native Lab bundle ID');
    if (typeof config.appleEnabled !== 'boolean') throw new Error('Set appleEnabled explicitly');
    if (
        config.appleEnabled &&
        (typeof config.appleTeamID !== 'string' ||
            !/^[A-Z0-9]{10}$/.test(config.appleTeamID) ||
            config.appleWebIdentityGrouped !== true)
    ) {
        throw new Error(
            'Confirm the Apple team and grouping with the existing web sign-in identity before enabling Apple'
        );
    }
    if (
        config.googleClientID != null &&
        (typeof config.googleClientID !== 'string' ||
            !/^776298253175-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(config.googleClientID))
    ) {
        throw new Error('Use an iOS OAuth client from the existing LearnCard Firebase project');
    }
    const clientID = config.googleClientID as string | null | undefined;
    const googleScheme = clientID
        ? `com.googleusercontent.apps.${clientID.replace('.apps.googleusercontent.com', '')}`
        : 'learncard-native-google-unconfigured';
    return {
        resource: JSON.stringify({
            bundleID: config.bundleID,
            appleEnabled: config.appleEnabled,
            googleClientID: clientID ?? null,
        }),
        xcconfig: [
            '// Generated from public native OAuth registration; see NATIVE_SIGN_IN.md.',
            `LC_NATIVE_GOOGLE_SCHEME = ${googleScheme}`,
            'CODE_SIGN_ENTITLEMENTS = GeneratedOAuth.entitlements',
            ...(config.appleEnabled ? [`DEVELOPMENT_TEAM = ${config.appleTeamID}`] : []),
            '',
        ].join('\n'),
        entitlements: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>${config.appleEnabled ? '<key>com.apple.developer.applesignin</key><array><string>Default</string></array>' : ''}</dict></plist>
`,
    };
};
