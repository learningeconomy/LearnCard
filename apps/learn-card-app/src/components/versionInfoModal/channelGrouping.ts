/**
 * Channel bucketing for the in-app Capgo channel switcher.
 *
 * Capgo channel naming (see `.github/workflows/capgo-staging.yml`):
 *
 *   - Production: `<major>.<minor>.<patch>` (e.g. `1.0.9`), pinned to the native
 *     compatibility window via `CapacitorUpdater.defaultChannel`.
 *   - Staging:    `<production>-staging` (e.g. `1.0.9-staging`) — the latest
 *     merged `main` for the same native window. Older `X.Y.Z-staging` channels
 *     linger after a channel bump, and a legacy unversioned `staging` channel
 *     still exists from before versioning.
 *   - PR previews: `pr-<n>`.
 */

export const SEMVER_RE = /^\d+\.\d+\.\d+$/;
export const STAGING_RE = /^(\d+\.\d+\.\d+)-staging$/;
export const LEGACY_STAGING_CHANNEL = 'staging';
export const PR_RE = /^pr-(\d+)$/;

export type ChannelKind = 'production' | 'staging' | 'pr' | 'custom';

export interface ChannelOption {
    value: string;
    label: string;
    description?: string;
    kind: ChannelKind;
}

export interface GroupedChannels {
    productionLatest?: ChannelOption;
    productionOlder: ChannelOption[];
    stagingLatest?: ChannelOption;
    stagingOlder: ChannelOption[];
    prPreviews: ChannelOption[];
}

export const compareSemverDesc = (a: string, b: string): number => {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);

    for (let i = 0; i < 3; i += 1) {
        if (pa[i] !== pb[i]) return pb[i] - pa[i];
    }

    return 0;
};

const stagingChannelFor = (productionChannel: string): string => `${productionChannel}-staging`;

const latestStagingOption = (name: string): ChannelOption => ({
    value: name,
    label: 'Staging (Latest)',
    description: `Latest merged code on \`main\` (\`${name}\`)`,
    kind: 'staging',
});

/**
 * Sort the self-assignable channels returned by `CapacitorUpdater.listChannels()`
 * into UI buckets.
 *
 * Production: the channel matching the build-time `__CAPGO_DEFAULT_CHANNEL__`
 * define is "Latest"; any other semver channels are older versions (newest
 * first). If the define is set but its channel isn't in the list (e.g. locked),
 * it is still surfaced so users can switch back.
 *
 * Staging mirrors production exactly: `<productionChannel>-staging` is "Latest"
 * (synthesized if missing from the list), every other `X.Y.Z-staging` channel
 * is an older staging version (newest first), and the legacy unversioned
 * `staging` channel is listed last among the older ones. When no production
 * channel is known, the highest-versioned staging channel present is treated
 * as Latest.
 */
export const groupChannels = (
    channels: { name: string }[],
    productionChannel: string | undefined
): GroupedChannels => {
    const names = channels.map(c => c.name);

    const productionOlder: ChannelOption[] = [];
    let productionLatest: ChannelOption | undefined;

    const semverChannels = names.filter(name => SEMVER_RE.test(name)).sort(compareSemverDesc);

    for (const name of semverChannels) {
        if (name === productionChannel) {
            productionLatest = {
                value: name,
                label: 'Production (Latest)',
                description: `Released app store build (\`${name}\`)`,
                kind: 'production',
            };
        } else {
            productionOlder.push({
                value: name,
                label: name,
                description: 'Older production version',
                kind: 'production',
            });
        }
    }

    if (!productionLatest && productionChannel) {
        productionLatest = {
            value: productionChannel,
            label: 'Production (Latest)',
            description: `Released app store build (\`${productionChannel}\`)`,
            kind: 'production',
        };
    }

    const stagingOlder: ChannelOption[] = [];
    let stagingLatest: ChannelOption | undefined;

    const versionedStaging = names
        .filter(name => STAGING_RE.test(name))
        .sort((a, b) => compareSemverDesc(a.match(STAGING_RE)![1], b.match(STAGING_RE)![1]));

    const expectedStaging = productionChannel ? stagingChannelFor(productionChannel) : undefined;
    // Without a known production channel, fall back to the newest staging present.
    const latestStagingName = expectedStaging ?? versionedStaging[0];

    for (const name of versionedStaging) {
        if (name === latestStagingName) {
            stagingLatest = latestStagingOption(name);
        } else {
            stagingOlder.push({
                value: name,
                label: name,
                description: 'Older staging version',
                kind: 'staging',
            });
        }
    }

    if (!stagingLatest && expectedStaging) {
        stagingLatest = latestStagingOption(expectedStaging);
    }

    if (names.includes(LEGACY_STAGING_CHANNEL)) {
        stagingOlder.push({
            value: LEGACY_STAGING_CHANNEL,
            label: LEGACY_STAGING_CHANNEL,
            description: 'Legacy unversioned staging channel',
            kind: 'staging',
        });
    }

    const prPreviews: ChannelOption[] = [];

    for (const name of names) {
        const prMatch = name.match(PR_RE);

        if (prMatch) {
            prPreviews.push({
                value: name,
                label: `Beta #${prMatch[1]}`,
                description: 'Open beta preview',
                kind: 'pr',
            });
        }
    }

    prPreviews.sort((a, b) => Number(b.value.slice(3)) - Number(a.value.slice(3)));

    return { productionLatest, productionOlder, stagingLatest, stagingOlder, prPreviews };
};
