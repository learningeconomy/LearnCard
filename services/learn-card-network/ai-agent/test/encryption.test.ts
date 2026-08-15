import type { JWE } from '@learncard/types';
import { describe, expect, it, vi } from 'vitest';

import type { AgentNetworkWallet } from '../src/helpers/learnCard.helpers';
import {
    createFieldAad,
    createLearnCardDagJweEncryptionService,
    isEncryptedEnvelope,
} from '../src/security/encryption';

const jwe: JWE = {
    protected: 'protected',
    iv: 'iv',
    ciphertext: 'ciphertext',
    tag: 'tag',
};

const aad = createFieldAad({
    collectionName: 'agentUserDocs',
    ownerDid: 'did:key:user',
    stableRecordId: 'memory-1',
    fieldPath: 'content',
});

const createWallet = (decrypted = { aad, value: { text: 'secret' } }): AgentNetworkWallet =>
    ({
        id: { did: vi.fn().mockReturnValue('did:key:agent') },
        invoke: {
            createDagJwe: vi.fn().mockResolvedValue(jwe),
            decryptDagJwe: vi.fn().mockResolvedValue(decrypted),
        },
    } as unknown as AgentNetworkWallet);

describe('AI Agent DAG-JWE encryption service', () => {
    it('wraps JSON with LearnCard DAG-JWE metadata', async () => {
        const wallet = createWallet();
        const service = createLearnCardDagJweEncryptionService({
            keyId: 'agent-key-v1',
            getWallet: async () => wallet,
        });

        const envelope = await service.encryptJson({ text: 'secret' }, aad);

        expect(wallet.invoke.createDagJwe).toHaveBeenCalledWith(
            { aad, value: { text: 'secret' } },
            ['did:key:agent']
        );
        expect(envelope).toEqual({
            __learnCardAiAgentEncrypted: true,
            version: 1,
            format: 'dag-jwe',
            kid: 'agent-key-v1',
            recipientDid: 'did:key:agent',
            jwe,
        });
        expect(isEncryptedEnvelope(envelope)).toBe(true);
    });

    it('decrypts envelopes and rejects mismatched field metadata', async () => {
        const wallet = createWallet();
        const service = createLearnCardDagJweEncryptionService({
            keyId: 'agent-key-v1',
            getWallet: async () => wallet,
        });
        const envelope = await service.encryptJson({ text: 'secret' }, aad);

        await expect(
            service.decryptJson<typeof envelope>(envelope, 'different-aad')
        ).rejects.toThrow('Encrypted AI Agent field metadata mismatch.');
        await expect(service.decryptJson<{ text: string }>(envelope, aad)).resolves.toEqual({
            text: 'secret',
        });
    });

    it('marks legacy plaintext without decrypting it', async () => {
        const wallet = createWallet();
        const service = createLearnCardDagJweEncryptionService({
            keyId: 'agent-key-v1',
            getWallet: async () => wallet,
        });

        await expect(service.decryptLegacyOrEnvelope('plaintext', aad)).resolves.toEqual({
            value: 'plaintext',
            legacyPlaintext: true,
        });
        expect(wallet.invoke.decryptDagJwe).not.toHaveBeenCalled();
    });
});
