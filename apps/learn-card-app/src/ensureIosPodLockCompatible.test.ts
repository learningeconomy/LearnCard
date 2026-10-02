import { describe, expect, it } from 'vitest';

import {
    findIncompatiblePods,
    getLockedPodMajor,
    getPodUpdateTargets,
    getRequiredPodMajor,
} from '../scripts/ensure-ios-pod-lock-compatible';

const cameraPodspec = `s.dependency 'IONCameraLib', spec='~> 2.0.0'`;
const fileTransferPodspec = `s.dependency 'IONFileTransferLib', spec='~> 2.0.0'`;

describe('iOS Podfile.lock compatibility guard', () => {
    it('reads locked and required major versions', () => {
        expect(getLockedPodMajor('  - IONCameraLib (1.0.5)', 'IONCameraLib')).toBe(1);
        expect(getRequiredPodMajor(cameraPodspec, 'IONCameraLib')).toBe(2);
    });

    it('finds every stale transitive pod in an existing Capacitor lockfile', () => {
        const oldLockfile = `
PODS:
  - IONCameraLib (1.0.5)
  - IONFileTransferLib (1.0.3)
`;

        expect(
            findIncompatiblePods(oldLockfile, [
                { name: 'IONCameraLib', contents: cameraPodspec },
                { name: 'IONFileTransferLib', contents: fileTransferPodspec },
            ])
        ).toEqual(['IONCameraLib', 'IONFileTransferLib']);
        expect(getPodUpdateTargets(['IONCameraLib', 'IONFileTransferLib'])).toEqual([
            'CapacitorCamera',
            'IONCameraLib',
            'CapacitorFileTransfer',
            'IONFileTransferLib',
        ]);
    });

    it('leaves compatible or newly introduced pods for normal Capacitor sync', () => {
        const currentLockfile = `
PODS:
  - IONCameraLib (2.0.0)
`;

        expect(
            findIncompatiblePods(currentLockfile, [
                { name: 'IONCameraLib', contents: cameraPodspec },
                { name: 'IONFileTransferLib', contents: fileTransferPodspec },
            ])
        ).toEqual([]);
    });
});
