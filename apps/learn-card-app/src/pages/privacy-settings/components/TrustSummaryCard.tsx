import React, { useEffect, useRef, useState } from 'react';
import { Shield } from 'lucide-react';

import {
    summarizeConsent,
    type ConsentedContract,
} from '../../../components/data-sharing/consentSummary';
import * as m from '../../../paraglide/messages.js';

const MAX_PROOF_AVATARS = 5;

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const useCountUp = (target: number, durationMs = 900): number => {
    const [value, setValue] = useState(target);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (prefersReducedMotion()) {
            setValue(target);
            return;
        }

        const start = performance.now();
        const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / durationMs);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) rafRef.current = requestAnimationFrame(tick);
        };

        setValue(0);
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [target, durationMs]);

    return value;
};

const ProofAvatar: React.FC<{ name: string; image?: string }> = ({ name, image }) => {
    const [failed, setFailed] = React.useState(false);
    const showImage = Boolean(image) && !failed;

    return showImage ? (
        <img
            src={image}
            alt={name}
            title={name}
            onError={() => setFailed(true)}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
        />
    ) : (
        <span
            title={name}
            className="w-9 h-9 rounded-full ring-2 ring-white bg-grayscale-100 flex items-center justify-center text-grayscale-400"
        >
            <Shield className="w-4 h-4" />
        </span>
    );
};

type TrustSummaryCardProps = {
    contracts: ConsentedContract[];
    delay?: number;
};

const TrustSummaryCard: React.FC<TrustSummaryCardProps> = ({ contracts, delay = 0 }) => {
    const { places, canRead, canWrite, proof } = summarizeConsent(contracts);
    const isEmpty = places === 0;

    const placesCount = useCountUp(places);
    const readCount = useCountUp(canRead);
    const writeCount = useCountUp(canWrite);

    const shownProof = proof.slice(0, MAX_PROOF_AVATARS);
    const overflow = proof.length - shownProof.length;

    return (
        <section
            className="relative overflow-hidden rounded-[24px] p-6 desktop:p-7 animate-fade-in-up border border-white/70 ring-1 ring-grayscale-900/[0.06] shadow-[0_8px_30px_rgba(24,34,78,0.10)] bg-gradient-to-br from-emerald-50 via-white/90 to-white/90 backdrop-blur-xl"
            style={delay ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
        >
            <div className="flex flex-col desktop:flex-row desktop:items-center gap-5 desktop:gap-6">
                <div className="flex items-start gap-4 min-w-0 desktop:flex-1">
                    <span
                        aria-hidden
                        className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${
                            isEmpty
                                ? 'bg-grayscale-100 text-grayscale-500'
                                : 'bg-emerald-100 text-emerald-600'
                        }`}
                    >
                        <Shield className="w-7 h-7" />
                    </span>

                    <div className="min-w-0">
                        <p className="text-xs font-medium tracking-wider text-grayscale-500 uppercase">
                            {m['dataShareCenter.trust.eyebrow']()}
                        </p>
                        <h2 className="mt-0.5 text-[22px] desktop:text-[26px] font-semibold text-grayscale-900 leading-tight">
                            {m['dataShareCenter.trust.title']()}
                        </h2>
                        <p
                            className="mt-2 text-sm text-grayscale-600 leading-relaxed"
                            aria-live="polite"
                        >
                            {isEmpty ? (
                                <>
                                    <span className="font-medium text-grayscale-900">
                                        {m['dataShareCenter.trust.nothingShared']()}
                                    </span>{' '}
                                    {m['dataShareCenter.trust.emptyDetail']()}
                                </>
                            ) : (
                                <>
                                    <span className="font-medium text-grayscale-900">
                                        {m['dataShareCenter.trust.sharingWith']({
                                            count: placesCount,
                                            unit:
                                                places === 1
                                                    ? m['dataShareCenter.trust.place']()
                                                    : m['dataShareCenter.trust.places'](),
                                        })}
                                    </span>{' '}
                                    {m['dataShareCenter.trust.canRead']({ count: readCount })}
                                    {canWrite > 0
                                        ? m['dataShareCenter.trust.canWriteSuffix']({
                                              count: writeCount,
                                          })
                                        : ''}
                                    {m['dataShareCenter.trust.stopAnytime']()}
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {!isEmpty && (
                    <div className="flex -space-x-2.5 pl-[72px] desktop:pl-0 desktop:shrink-0">
                        {shownProof.map(item => (
                            <ProofAvatar key={item.uri} name={item.name} image={item.image} />
                        ))}
                        {overflow > 0 && (
                            <span className="w-9 h-9 rounded-full ring-2 ring-white bg-grayscale-100 text-grayscale-600 text-xs font-medium flex items-center justify-center">
                                +{overflow}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default TrustSummaryCard;
