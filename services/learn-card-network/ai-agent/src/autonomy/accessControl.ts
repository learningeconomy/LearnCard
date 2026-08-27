import { init, type LDClient, type LDEvaluationDetail } from '@launchdarkly/node-server-sdk';

import type { ServiceConfig } from '../config';

let launchDarklyClient: LDClient | undefined;
let launchDarklyClientKey: string | undefined;
let launchDarklyInitialization: Promise<LDClient> | undefined;

const getLaunchDarklyClient = async (sdkKey: string): Promise<LDClient> => {
    if (!launchDarklyClient) {
        launchDarklyClient = init(sdkKey);
        launchDarklyClientKey = sdkKey;
        launchDarklyInitialization = launchDarklyClient.waitForInitialization({ timeout: 5 });
    }

    if (launchDarklyClientKey !== sdkKey) {
        throw new Error('The LaunchDarkly SDK key changed without restarting the AI Agent.');
    }

    return launchDarklyInitialization;
};

const assertEvaluationSucceeded = (detail: LDEvaluationDetail): void => {
    if (detail.reason.kind !== 'ERROR') return;

    throw new Error(`LaunchDarkly autonomy access evaluation failed: ${detail.reason.errorKind}.`);
};

export const isAutonomousExecutionAllowed = async (
    config: ServiceConfig,
    ownerDid: string
): Promise<boolean> => {
    const triggerEnvironment = config.triggerEnvironment?.trim().toLowerCase();

    if (config.nodeEnv === 'development' && triggerEnvironment === 'dev') {
        return config.autonomyDevDids.includes(ownerDid);
    }

    if (!config.launchDarklySdkKey) {
        throw new Error('LAUNCHDARKLY_SDK_KEY is required for staging autonomous execution.');
    }

    const client = await getLaunchDarklyClient(config.launchDarklySdkKey);
    const detail = await client.variationDetail(
        config.autonomyLaunchDarklyFlagKey,
        { kind: 'user', key: ownerDid },
        false
    );

    assertEvaluationSucceeded(detail);

    return detail.value === true;
};

export const assertAutonomousExecutionAllowed = async (
    config: ServiceConfig,
    ownerDid: string
): Promise<void> => {
    if (await isAutonomousExecutionAllowed(config, ownerDid)) return;

    throw new Error('The schedule owner is not enabled for autonomous execution.');
};

export const closeAutonomyAccessControl = async (): Promise<void> => {
    const client = launchDarklyClient;

    launchDarklyClient = undefined;
    launchDarklyClientKey = undefined;
    launchDarklyInitialization = undefined;

    if (client) await client.close();
};
