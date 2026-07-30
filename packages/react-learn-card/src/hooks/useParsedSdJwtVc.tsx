import { useState, useEffect } from 'react';
import { LearnCard } from '@learncard/core';

export type ParsedSdJwtVc = {
    vct: string;
    issuer: string;
    issuedAt?: Date;
    expiresAt?: Date;
    notBefore?: Date;
    holderPublicKey?: Record<string, unknown>;
    claims: Record<string, unknown>;
    disclosureKeys: string[];
    header: Record<string, unknown>;
    rawPayload: Record<string, unknown>;
    rawSdJwt: string;
    format: 'dc+sd-jwt' | 'vc+sd-jwt';
    hasKeyBinding: boolean;
};

export const useParsedSdJwtVc = (learnCard: LearnCard | undefined, compact: string | undefined) => {
    const [data, setData] = useState<ParsedSdJwtVc | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;

        if (!learnCard || !compact) {
            setData(undefined);
            setIsLoading(false);
            setError(undefined);
            return;
        }

        const parse = async () => {
            setIsLoading(true);
            setError(undefined);
            setData(undefined);
            try {
                const parsed = await (learnCard.invoke as any).parseSdJwtVc(compact);
                if (!cancelled) {
                    setData(parsed as ParsedSdJwtVc);
                }
            } catch (err) {
                if (!cancelled) {
                    setData(undefined);
                    setError(err instanceof Error ? err : new Error(String(err)));
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        parse();

        return () => {
            cancelled = true;
        };
    }, [learnCard, compact]);

    return { data, isLoading, error };
};
