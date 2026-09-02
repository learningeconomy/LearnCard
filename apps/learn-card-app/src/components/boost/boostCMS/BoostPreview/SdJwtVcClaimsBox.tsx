import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { lockClosedOutline, alertCircleOutline } from 'ionicons/icons';
import { VC } from '@learncard/types';
import { LearnCard } from '@learncard/core';
import { useWallet } from 'learn-card-base';
import {
    useCredentialFormat,
    useParsedSdJwtVc,
    humanizeClaimLabel,
    formatClaimValue,
} from '@learncard/react';

type SdJwtVcClaimsBoxProps = {
    credential: VC;
};

const ClaimsBoxShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-white flex flex-col items-start gap-[12px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full font-poppins">
        {children}
    </div>
);

const ClaimsBoxHeader: React.FC = () => (
    <div className="w-full flex items-center justify-between gap-[8px]">
        <h3 className="text-[17px] text-grayscale-900 font-poppins">
            Selectively Disclosable Claims
        </h3>
        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
            Privacy First
        </span>
    </div>
);

const SdJwtVcClaimsBoxContent: React.FC<SdJwtVcClaimsBoxProps> = ({ credential }) => {
    const format = useCredentialFormat(credential);
    const isSdJwt = format === 'dc+sd-jwt' || format === 'vc+sd-jwt';

    const proof = credential.proof;
    const proofs = Array.isArray(proof) ? proof : proof ? [proof] : [];
    const sdJwtProof = proofs.find(
        (p: any) => p?.type === 'SdJwtCompactProof' && typeof p?.jwt === 'string'
    );
    const compact = typeof sdJwtProof?.jwt === 'string' ? sdJwtProof.jwt : undefined;

    const [wallet, setWallet] = useState<LearnCard | undefined>(undefined);
    const { initWallet } = useWallet();

    useEffect(() => {
        if (!isSdJwt || !compact) return;
        let cancelled = false;
        initWallet().then((w: LearnCard) => {
            if (!cancelled) setWallet(w);
        });
        return () => {
            cancelled = true;
        };
    }, [initWallet, isSdJwt, compact]);

    const {
        data: parsed,
        isLoading,
        error,
    } = useParsedSdJwtVc(wallet, isSdJwt ? compact : undefined);

    if (!isSdJwt || !compact) return null;

    if (isLoading) {
        return (
            <div className="bg-white flex flex-col items-start gap-[12px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full animate-pulse">
                <div className="w-full flex items-center justify-between gap-[8px]">
                    <div className="h-5 bg-grayscale-100 rounded w-1/2"></div>
                    <div className="h-5 bg-grayscale-100 rounded-full w-16"></div>
                </div>
                <div className="h-3 bg-grayscale-100 rounded w-full mt-2"></div>
                <div className="h-3 bg-grayscale-100 rounded w-5/6"></div>
                <div className="w-full border-t border-grayscale-100 my-2"></div>
                <div className="w-full flex flex-col gap-3">
                    <div className="flex items-start py-2">
                        <div className="h-4 bg-grayscale-100 rounded w-24 min-w-[140px]"></div>
                        <div className="h-4 bg-grayscale-100 rounded w-32"></div>
                    </div>
                    <div className="flex items-start py-2">
                        <div className="h-4 bg-grayscale-100 rounded w-20 min-w-[140px]"></div>
                        <div className="h-4 bg-grayscale-100 rounded w-40"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !parsed || !parsed.claims) {
        return (
            <ClaimsBoxShell>
                <ClaimsBoxHeader />
                <div className="w-full flex items-start gap-2.5 p-3 bg-grayscale-10 rounded-2xl">
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-grayscale-400 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-grayscale-600 leading-relaxed">
                        We couldn't read the disclosed claims for this credential.
                    </span>
                </div>
            </ClaimsBoxShell>
        );
    }

    const disclosedKeySet = new Set(parsed.disclosureKeys ?? []);
    const sortedClaims = Object.entries(parsed.claims)
        .filter(([key]) => disclosedKeySet.has(key))
        .sort(([a], [b]) => a.localeCompare(b));

    if (sortedClaims.length === 0) {
        return (
            <ClaimsBoxShell>
                <ClaimsBoxHeader />
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    This credential has no selectively disclosable claims.
                </p>
            </ClaimsBoxShell>
        );
    }

    let isBoundToDevice = false;
    let hasBinding = false;

    if (parsed.holderPublicKey?.x) {
        hasBinding = true;
        try {
            const keypair = (
                wallet as unknown as { id: { keypair: (alg: string) => unknown } }
            )?.id?.keypair('ed25519') as { publicKeyJwk?: { x?: string }; x?: string } | undefined;
            const activeKeyX = keypair?.publicKeyJwk?.x ?? keypair?.x;
            if (activeKeyX && activeKeyX === parsed.holderPublicKey.x) {
                isBoundToDevice = true;
            }
        } catch (e) {
            // Active keypair unavailable (e.g. wallet not fully initialized) \u2014 leave as "another device"
        }
    }

    return (
        <ClaimsBoxShell>
            <ClaimsBoxHeader />

            <p className="text-sm text-grayscale-600 leading-relaxed">
                These details are stored together but can be shared individually. When you present
                this credential, you'll choose which to reveal.
            </p>

            <div className="w-full border-t border-grayscale-100 my-1"></div>

            <div className="w-full flex flex-col">
                {sortedClaims.map(([key, value]) => (
                    <div
                        key={key}
                        className="flex items-start py-2 border-b border-grayscale-100 last:border-b-0"
                    >
                        <div className="text-xs font-medium text-grayscale-700 min-w-[140px] pr-4">
                            {humanizeClaimLabel(key)}
                        </div>
                        <div className="text-sm text-grayscale-900 flex-1 break-words">
                            {formatClaimValue(value)}
                        </div>
                    </div>
                ))}
            </div>

            {hasBinding && (
                <div className="w-full flex items-center gap-2 mt-1 pt-3 border-t border-grayscale-100">
                    <IonIcon
                        icon={lockClosedOutline}
                        className={`text-base ${
                            isBoundToDevice ? 'text-emerald-600' : 'text-grayscale-400'
                        }`}
                    />
                    <span
                        className={`text-xs ${
                            isBoundToDevice ? 'text-emerald-700' : 'text-grayscale-500'
                        }`}
                    >
                        {isBoundToDevice ? 'Bound to this device' : 'Bound to another device'}
                    </span>
                </div>
            )}
        </ClaimsBoxShell>
    );
};

// The claim deep-link (`/notifications?uri=...&claim=true`) opens the claim modal
// before the credential has resolved, so guard against a not-yet-loaded credential.
export const SdJwtVcClaimsBox: React.FC<{ credential?: VC }> = ({ credential }) =>
    credential ? <SdJwtVcClaimsBoxContent credential={credential} /> : null;

export default SdJwtVcClaimsBox;
