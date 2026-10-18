import { describe, expect, it } from 'vitest';

import {
    findIncompatiblePods,
    getLockedPodVersion,
    getPodUpdateTargets,
    getRequiredPodVersion,
} from '../scripts/ensure-ios-pod-lock-compatible';

const cameraPodspec = `s.dependency 'IONCameraLib', spec='~> 2.0.0'`;
const fileTransferPodspec = `s.dependency 'IONFileTransferLib', spec='~> 2.0.0'`;
const fileViewerPodspec = `s.dependency 'IONFileViewerLib', spec='~> 2.0.0'`;

describe('iOS Podfile.lock compatibility guard', () => {
    it('reads locked versions and pessimistic requirements', () => {
        expect(getLockedPodVersion('  - IONCameraLib (1.0.5)', 'IONCameraLib')).toBe('1.0.5');
        expect(getRequiredPodVersion(cameraPodspec, 'IONCameraLib')).toEqual({
            version: '2.0.0',
            pessimistic: true,
        });
    });

    it('updates Filesystem and its owner for the exact 2.0.0 to 2.0.1 mismatch', () => {
        const incompatible = findIncompatiblePods(
            `PODS:
  - CapacitorFilesystem (8.1.4):
    - IONFilesystemLib (~> 2.0.0)
  - IONFilesystemLib (2.0.0)
`,
            [
                {
                    name: 'IONFilesystemLib',
                    contents: "s.dependency 'IONFilesystemLib', spec='2.0.1'",
                },
            ]
        );
        expect(incompatible).toEqual(['IONFilesystemLib']);
        expect(getPodUpdateTargets(incompatible)).toEqual([
            'CapacitorFilesystem',
            'IONFilesystemLib',
        ]);
    });

    it.each([
        ['2.0.0', '2.0.1', true],
        ['2.0.1', '2.0.1', false],
        ['2.0.2', '2.0.1', true],
        ['2.0.0', '~> 2.0.1', true],
        ['2.0.2', '~> 2.0.1', false],
        ['2.1.0', '~> 2.0.1', true],
        ['2.9.0', '~> 2.0', false],
        ['3.0.0', '~> 2.0', true],
        ['2.0.1', '= 2.0.1', false],
        ['2.0.0', '= 2.0.1', true],
    ])('checks %s against %s (incompatible: %s)', (locked, required, incompatible) => {
        expect(
            findIncompatiblePods(`  - IONFilesystemLib (${locked})`, [
                {
                    name: 'IONFilesystemLib',
                    contents: `s.dependency "IONFilesystemLib", "${required}"`,
                },
            ])
        ).toEqual(incompatible ? ['IONFilesystemLib'] : []);
    });

    it('leaves unknown expressions and missing versions to CocoaPods', () => {
        expect(
            findIncompatiblePods('  - IONFilesystemLib (2.0.0)', [
                {
                    name: 'IONFilesystemLib',
                    contents: "s.dependency 'IONFilesystemLib', version_variable",
                },
            ])
        ).toEqual([]);
        expect(
            findIncompatiblePods('', [
                {
                    name: 'IONFilesystemLib',
                    contents: "s.dependency 'IONFilesystemLib', '2.0.1'",
                },
            ])
        ).toEqual([]);
    });

    it('finds every stale transitive pod in an existing Capacitor lockfile', () => {
        const oldLockfile = `
PODS:
  - IONCameraLib (1.0.5)
  - IONFileTransferLib (1.0.3)
  - IONFileViewerLib (1.0.3)
`;

        expect(
            findIncompatiblePods(oldLockfile, [
                { name: 'IONCameraLib', contents: cameraPodspec },
                { name: 'IONFileTransferLib', contents: fileTransferPodspec },
                { name: 'IONFileViewerLib', contents: fileViewerPodspec },
            ])
        ).toEqual(['IONCameraLib', 'IONFileTransferLib', 'IONFileViewerLib']);
        expect(
            getPodUpdateTargets(['IONCameraLib', 'IONFileTransferLib', 'IONFileViewerLib'])
        ).toEqual([
            'CapacitorCamera',
            'IONCameraLib',
            'CapacitorFileTransfer',
            'IONFileTransferLib',
            'CapacitorFileViewer',
            'IONFileViewerLib',
        ]);
    });

    it('updates only FileViewer and its owner when Camera and FileTransfer are already compatible', () => {
        const lockfile = `
PODS:
  - IONCameraLib (2.0.0)
  - IONFileTransferLib (2.0.0)
  - IONFileViewerLib (1.0.3)
`;
        const incompatiblePods = findIncompatiblePods(lockfile, [
            { name: 'IONCameraLib', contents: cameraPodspec },
            { name: 'IONFileTransferLib', contents: fileTransferPodspec },
            { name: 'IONFileViewerLib', contents: fileViewerPodspec },
        ]);

        expect(incompatiblePods).toEqual(['IONFileViewerLib']);
        expect(getPodUpdateTargets(incompatiblePods)).toEqual([
            'CapacitorFileViewer',
            'IONFileViewerLib',
        ]);
    });

    it('leaves compatible or newly introduced pods for normal Capacitor sync', () => {
        const currentLockfile = `
PODS:
  - IONCameraLib (2.0.0)
  - IONFileViewerLib (2.0.0)
`;

        expect(
            findIncompatiblePods(currentLockfile, [
                { name: 'IONCameraLib', contents: cameraPodspec },
                { name: 'IONFileTransferLib', contents: fileTransferPodspec },
                { name: 'IONFileViewerLib', contents: fileViewerPodspec },
            ])
        ).toEqual([]);
    });
});
