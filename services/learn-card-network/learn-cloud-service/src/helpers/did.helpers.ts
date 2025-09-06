import { getEmptyLearnCard } from './learnCard.helpers';
import { base58btc } from 'multiformats/bases/base58';
import { base64url } from 'multiformats/bases/base64';

export const areDidsEqual = async (did1: string, did2: string) => {
    try {
        if (did1 === did2) return true;

        if (!did1.startsWith('did') || !did2.startsWith('did')) return false;

        const lc = await getEmptyLearnCard();

        const [resolvedDid1, resolvedDid2] = await Promise.all([
            lc.invoke.resolveDid(did1),
            lc.invoke.resolveDid(did2),
        ]);

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

        const keys1 = (resolvedDid1?.verificationMethod || [])
            .map(vm => toX(vm as any))
            .filter(Boolean) as string[];
        const keys2 = (resolvedDid2?.verificationMethod || [])
            .map(vm => toX(vm as any))
            .filter(Boolean) as string[];

        return keys1.some(x => keys2.includes(x));
    } catch (error) {
        console.error('Are dids equal error', error, did1, did2);
        return false;
    }
};
