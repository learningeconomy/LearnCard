import { describe, expect, it, vi } from 'vitest';
import { initLearnCard } from '@learncard/init';
import { getClrDemoEnvironmentError, sendClrVerificationDemo } from './clr-verification-demo';
import type { NetworkEnvConfig } from '../context/WalletContext';

vi.mock('@learncard/init', () => ({ initLearnCard: vi.fn() }));

const local: NetworkEnvConfig = {
    label: 'Local',
    network: 'http://localhost:4000/trpc',
    cloud: 'http://localhost:4100/trpc',
    lcaApi: 'http://localhost:5100/trpc',
};

describe('CLR demo environment safety', () => {
    it('permits only exact presets and loopback custom services', () => {
        expect(getClrDemoEnvironmentError('local', local)).toBeNull();
        expect(getClrDemoEnvironmentError('production', local)).toBeTruthy();
        expect(
            getClrDemoEnvironmentError('local', {
                ...local,
                network: 'https://network.learncard.com/trpc',
            })
        ).toBeTruthy();
        expect(
            getClrDemoEnvironmentError('custom', {
                ...local,
                cloud: 'https://cloud.learncard.com/trpc',
            })
        ).toBeTruthy();
        expect(
            getClrDemoEnvironmentError('custom', { ...local, cloud: 'http://127.0.0.1:4100/trpc' })
        ).toBeNull();
    });

    it('rejects production before touching the publisher', async () => {
        const getProfile = vi.fn();
        await expect(
            sendClrVerificationDemo({
                wallet: { invoke: { getProfile } },
                envKey: 'production',
                envConfig: local,
                recipient: 'learner',
            })
        ).rejects.toThrow();
        expect(getProfile).not.toHaveBeenCalled();
    });

    it('rejects a publisher connected to a different network before delivery', async () => {
        const getProfile = vi.fn().mockResolvedValue({
            profileId: 'publisher',
            did: 'did:web:network.learncard.com:users:publisher',
        });
        const sendCredential = vi.fn();
        await expect(
            sendClrVerificationDemo({
                wallet: {
                    id: { did: () => 'did:web:network.learncard.com:users:publisher' },
                    invoke: { getProfile, sendCredential },
                },
                envKey: 'local',
                envConfig: local,
                recipient: 'learner',
            })
        ).rejects.toThrow(/selected network/);
        expect(getProfile).toHaveBeenCalledTimes(1);
        expect(sendCredential).not.toHaveBeenCalled();
    });

    it('does not deliver a false-green transcript when a successful mutation leaves the public bit clear', async () => {
        const did = (profile: string) => `did:web:localhost%3A4000:users:${profile}`;
        const publisher = { profileId: 'publisher', did: did('publisher') };
        const learner = { profileId: 'learner', did: did('learner') };
        const sendCredential = vi.fn();
        const issueCredential = vi.fn(async (credential: Record<string, unknown>) => ({
            ...credential,
            proof: { type: 'Unit-test-only signer result' },
        }));
        let sourceId = '';
        const district = (profile: string) => ({
            id: { did: () => did(profile) },
            invoke: {
                getProfile: vi.fn().mockResolvedValue({ profileId: profile, did: did(profile) }),
                createProfile: vi.fn().mockResolvedValue(true),
                issueCredential,
                createBoost: vi.fn(async (credential: { id: string }) => {
                    sourceId = credential.id;
                    return 'boost:unit-test';
                }),
                sendBoost: vi.fn(async () => ({
                    credentialUri: 'credential:unit-test',
                    refresh: {
                        credentialId: sourceId,
                        holderDid: learner.did,
                        issuerDid: did(profile),
                        credentialStatus: ['revocation', 'suspension'].map(statusPurpose => ({
                            id: `http://localhost:4000/status-lists/${statusPurpose}#7`,
                            type: 'BitstringStatusListEntry',
                            statusPurpose,
                            statusListCredential: `http://localhost:4000/status-lists/${statusPurpose}`,
                            statusListIndex: '7',
                        })),
                    },
                })),
                revokeBoostRecipient: vi.fn().mockResolvedValue(true),
                verifyCredential: vi.fn().mockResolvedValue({
                    checks: ['proof', 'status'],
                    errors: [],
                    status: [{ statusPurpose: 'revocation', isSet: false }],
                }),
            },
        });
        vi.mocked(initLearnCard)
            .mockResolvedValueOnce(
                district('district-a') as unknown as Awaited<ReturnType<typeof initLearnCard>>
            )
            .mockResolvedValueOnce(
                district('district-b') as unknown as Awaited<ReturnType<typeof initLearnCard>>
            );
        await expect(
            sendClrVerificationDemo({
                wallet: {
                    id: { did: () => publisher.did },
                    invoke: {
                        getProfile: vi.fn(async (profileId?: string) =>
                            profileId ? learner : publisher
                        ),
                        sendCredential,
                    },
                },
                envKey: 'local',
                envConfig: local,
                recipient: learner.profileId,
            })
        ).rejects.toThrow('did not confirm the published revocation status');
        expect(sendCredential).not.toHaveBeenCalled();
    });
});
