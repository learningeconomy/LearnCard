#!/usr/bin/env bun

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface PodDependency {
    name: string;
    owner: string;
    podspecPath: string;
}

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MONOREPO_ROOT = resolve(APP_ROOT, '../..');
const IOS_APP_ROOT = resolve(APP_ROOT, 'ios/App');
const PODFILE_LOCK = resolve(IOS_APP_ROOT, 'Podfile.lock');

const TRANSITIVE_PODS: PodDependency[] = [
    {
        name: 'IONCameraLib',
        owner: 'CapacitorCamera',
        podspecPath: resolve(
            MONOREPO_ROOT,
            'node_modules/@capacitor/camera/CapacitorCamera.podspec'
        ),
    },
    {
        name: 'IONFileTransferLib',
        owner: 'CapacitorFileTransfer',
        podspecPath: resolve(
            MONOREPO_ROOT,
            'node_modules/@capacitor/file-transfer/CapacitorFileTransfer.podspec'
        ),
    },
    {
        name: 'IONFileViewerLib',
        owner: 'CapacitorFileViewer',
        podspecPath: resolve(
            MONOREPO_ROOT,
            'node_modules/@capacitor/file-viewer/CapacitorFileViewer.podspec'
        ),
    },
];

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getLockedPodMajor = (lockfile: string, podName: string): number | undefined => {
    const match = lockfile.match(new RegExp(`^\\s+- ${escapeRegExp(podName)} \\((\\d+)\\.`, 'm'));

    return match ? Number(match[1]) : undefined;
};

export const getRequiredPodMajor = (podspec: string, podName: string): number | undefined => {
    const match = podspec.match(
        new RegExp(`s\\.dependency\\s+['"]${escapeRegExp(podName)}['"][^\\n]*~>\\s*(\\d+)\\.`)
    );

    return match ? Number(match[1]) : undefined;
};

export const findIncompatiblePods = (
    lockfile: string,
    podspecs: Array<{ name: string; contents: string }>
): string[] =>
    podspecs.flatMap(({ name, contents }) => {
        const lockedMajor = getLockedPodMajor(lockfile, name);
        const requiredMajor = getRequiredPodMajor(contents, name);

        return lockedMajor !== undefined &&
            requiredMajor !== undefined &&
            lockedMajor !== requiredMajor
            ? [name]
            : [];
    });

export const getPodUpdateTargets = (incompatiblePods: string[]): string[] =>
    TRANSITIVE_PODS.filter(({ name }) => incompatiblePods.includes(name)).flatMap(
        ({ owner, name }) => [owner, name]
    );

export const ensureIosPodLockCompatible = (): void => {
    if (!existsSync(PODFILE_LOCK)) return;

    const podspecs = TRANSITIVE_PODS.filter(({ podspecPath }) => existsSync(podspecPath)).map(
        ({ name, podspecPath }) => ({ name, contents: readFileSync(podspecPath, 'utf8') })
    );
    const incompatiblePods = findIncompatiblePods(readFileSync(PODFILE_LOCK, 'utf8'), podspecs);

    if (incompatiblePods.length === 0) return;

    const updateTargets = getPodUpdateTargets(incompatiblePods);
    console.info(`Updating stale iOS pods: ${updateTargets.join(', ')}`);
    const result = spawnSync('pod', ['update', ...updateTargets], {
        cwd: IOS_APP_ROOT,
        stdio: 'inherit',
    });

    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
};

if (import.meta.main) ensureIosPodLockCompatible();
