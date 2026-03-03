import { VCImplicitLearnCard } from './types';
import { base58btc } from 'multiformats/bases/base58';
import { base64url } from 'multiformats/bases/base64';

/**
 * Determines the default verification method to use for a given did by resolving it and looking
 * for a keypair that matches the default keypair for the LearnCard
 */
export const getDefaultVerificationMethod = async (
    learnCard: VCImplicitLearnCard,
    issuerDid: string
) => {
    const kp = learnCard.id.keypair();

    if (!kp) {
        throw new Error('Cannot get default verification method: unable to get subject keypair');
    }

    const issuerDidDoc = await learnCard.invoke.resolveDid(issuerDid);

    const toX = (vm: any): string | undefined => {
        if (!vm || typeof vm === 'string') return undefined;
        if (vm.publicKeyJwk?.x) return vm.publicKeyJwk.x;
        if (vm.publicKeyMultibase) {
            const decoded = base58btc.decode(vm.publicKeyMultibase);
            const ed = decoded[0] === 0xed && decoded[1] === 0x01 ? decoded.slice(2) : decoded;
            return base64url.encode(ed).slice(1);
        }
        if (vm.publicKeyBase58) {
            const ed = base58btc.baseDecode(vm.publicKeyBase58);
            return base64url.encode(ed).slice(1);
        }
        return undefined;
    };

    const verificationMethodEntry =
        typeof issuerDidDoc === 'string'
            ? undefined
            : issuerDidDoc?.verificationMethod?.find(entry => toX(entry as any) === kp.x);

    const verificationMethod =
        (typeof verificationMethodEntry !== 'string' && verificationMethodEntry?.id) ||
        (await learnCard.invoke.didToVerificationMethod(issuerDid));

    return verificationMethod;
};
