import { useMemo } from 'react';

export type CredentialFormat = 'dc+sd-jwt' | 'vc+sd-jwt' | 'jwt-vc-json' | 'ldp-vc' | 'unknown';

export const useCredentialFormat = (vc: unknown): CredentialFormat => {
    return useMemo(() => {
        if (!vc || typeof vc !== 'object') return 'unknown';
        const proof = (vc as any).proof;
        const proofs: any[] = Array.isArray(proof) ? proof : proof ? [proof] : [];

        const sdJwt = proofs.find(
            p => p?.type === 'SdJwtCompactProof' && typeof p?.jwt === 'string'
        );
        if (sdJwt) return 'dc+sd-jwt';

        const proofObj = proofs.find(p => p && typeof p === 'object');
        if (typeof proofObj?.jwt === 'string' || proofObj?.type === 'JwtProof2020') {
            return 'jwt-vc-json';
        }
        if (typeof proofObj?.type === 'string') return 'ldp-vc';
        return 'unknown';
    }, [vc]);
};
