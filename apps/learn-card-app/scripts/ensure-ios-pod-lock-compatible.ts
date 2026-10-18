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
        name: 'IONFilesystemLib',
        owner: 'CapacitorFilesystem',
        podspecPath: resolve(
            MONOREPO_ROOT,
            'node_modules/@capacitor/filesystem/CapacitorFilesystem.podspec'
        ),
    },
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

export const getLockedPodVersion = (lockfile: string, podName: string): string | undefined => {
    const match = lockfile.match(
        new RegExp(`^\\s+- ${escapeRegExp(podName)} \\((\\d+(?:\\.\\d+){0,2})\\)`, 'm')
    );

    return match?.[1];
};

interface PodRequirement {
    version: string;
    pessimistic: boolean;
}

// The tracked Capacitor podspecs use either exact versions or Ruby's ~> ranges.
// Leave unsupported expressions to CocoaPods rather than guessing their meaning.
export const getRequiredPodVersion = (
    podspec: string,
    podName: string
): PodRequirement | undefined => {
    const match = podspec.match(
        new RegExp(
            `^\\s*s\\.dependency\\s+['"]${escapeRegExp(podName)}['"]\\s*,\\s*(?:spec\\s*=\\s*)?['"](~>\\s*|=\\s*)?(\\d+(?:\\.\\d+){0,2})['"]\\s*(?:#.*)?$`,
            'm'
        )
    );

    return match ? { version: match[2]!, pessimistic: match[1]?.trim() === '~>' } : undefined;
};

const compareVersions = (left: number[], right: number[]): number => {
    for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
        const difference = (left[index] ?? 0) - (right[index] ?? 0);
        if (difference !== 0) return difference;
    }
    return 0;
};

export const findIncompatiblePods = (
    lockfile: string,
    podspecs: Array<{ name: string; contents: string }>
): string[] =>
    podspecs.flatMap(({ name, contents }) => {
        const locked = getLockedPodVersion(lockfile, name);
        const required = getRequiredPodVersion(contents, name);
        if (!locked || !required) return [];

        const lockedParts = locked.split('.').map(Number);
        const requiredParts = required.version.split('.').map(Number);
        const comparison = compareVersions(lockedParts, requiredParts);
        if (!required.pessimistic) return comparison === 0 ? [] : [name];

        // ~> 2.0.1 permits < 2.1.0, while ~> 2.0 permits < 3.0.0.
        const upperBound = requiredParts.slice(0, Math.max(1, requiredParts.length - 1));
        upperBound[upperBound.length - 1]! += 1;
        return comparison < 0 || compareVersions(lockedParts, upperBound) >= 0 ? [name] : [];
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
