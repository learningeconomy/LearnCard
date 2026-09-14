import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClrLearnerIdentity } from './useClrLearnerIdentity';

const mocks = vi.hoisted(() => ({ getProfile: vi.fn() }));
vi.mock('learn-card-base', () => ({ useGetProfile: mocks.getProfile }));
const did = 'did:web:localhost%3A4000:users:billygates';

describe('useClrLearnerIdentity', () => {
    beforeEach(() => mocks.getProfile.mockReturnValue({ data: undefined }));

    it('resolves a local DID to the matching profile name and photo', () => {
        mocks.getProfile.mockReturnValue({
            data: { did, displayName: 'Billy', image: 'avatar.png' },
        });
        const { result } = renderHook(() => useClrLearnerIdentity(did));
        expect(mocks.getProfile).toHaveBeenCalledWith('billygates', true);
        expect(result.current).toMatchObject({ displayName: 'Billy', image: 'avatar.png' });
    });

    it('preserves a credential-provided name without requesting a profile', () => {
        const { result } = renderHook(() => useClrLearnerIdentity('William Gates'));
        expect(mocks.getProfile).toHaveBeenCalledWith(undefined, false);
        expect(result.current.displayName).toBe('William Gates');
    });

    it('keeps the DID while the profile is unavailable', () => {
        expect(renderHook(() => useClrLearnerIdentity(did)).result.current.displayName).toBe(did);
    });

    it('does not use a same-named profile from another network', () => {
        mocks.getProfile.mockReturnValue({
            data: { did: 'did:web:other.example:users:billygates', displayName: 'Other Billy' },
        });
        expect(renderHook(() => useClrLearnerIdentity(did)).result.current.displayName).toBe(did);
    });

    it('uses the profile ID when the matching profile has no display name', () => {
        mocks.getProfile.mockReturnValue({ data: { did, profileId: 'billygates' } });
        expect(renderHook(() => useClrLearnerIdentity(did)).result.current.displayName).toBe(
            'billygates'
        );
    });
});
