import React, { useEffect, useRef, useState } from 'react';
import { ImageIcon } from 'lucide-react';

import { BoostCategoryOptionsEnum, BoostPageViewMode } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { BoostEarnedCard } from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import type { SimpleCredentialType } from '../../../components/simple-send/simpleSend.helpers';

interface HeroCanvasProps {
    credential: Record<string, unknown> | null;
    credentialType: SimpleCredentialType | null;
    cardTitle?: string;
    hasImage?: boolean;
}

const useChangePulse = (value: string): boolean => {
    const [pulsing, setPulsing] = useState(false);
    const previous = useRef(value);

    useEffect(() => {
        if (previous.current !== value && value.trim()) {
            setPulsing(true);
            const timer = setTimeout(() => setPulsing(false), 340);
            previous.current = value;
            return () => clearTimeout(timer);
        }
        previous.current = value;
    }, [value]);

    return pulsing;
};

const SkeletonCard: React.FC = () => (
    <div className="w-[160px] h-[275px] rounded-[20px] bg-white border border-grayscale-200 shadow-sm overflow-hidden animate-fade-in-up flex flex-col">
        <div className="h-[110px] w-[110px] my-[10px] mx-auto rounded-full bg-grayscale-100 flex items-center justify-center shrink-0">
            <ImageIcon className="w-8 h-8 text-grayscale-300" />
        </div>
        <div className="px-2 pb-5 flex-1 flex flex-col justify-end space-y-3">
            <div className="h-3 rounded-full bg-grayscale-100 w-3/4 mx-auto" />
            <div className="h-2 rounded-full bg-grayscale-100 w-1/2 mx-auto" />
        </div>
    </div>
);

export const HeroCanvas: React.FC<HeroCanvasProps> = ({
    credential,
    credentialType,
    cardTitle = '',
    hasImage = false,
}) => {
    const popping = useChangePulse(cardTitle);
    const glowing = useChangePulse(hasImage ? 'has-image' : '');

    return (
        <div className="w-full flex flex-col items-center gap-4">
            {credentialType && credential ? (
                <div
                    className={`w-[160px] rounded-[24px] transition-all duration-300 animate-fade-in-up motion-reduce:animate-none ${
                        popping ? 'motion-safe:animate-card-pop' : ''
                    } ${glowing ? 'motion-safe:animate-glow-pulse' : ''}`}
                >
                    <div
                        key={hasImage ? 'with-image' : 'no-image'}
                        className={hasImage ? 'motion-safe:animate-image-drop' : ''}
                    >
                        <BoostEarnedCard
                            credential={credential as any}
                            categoryType={
                                getDefaultCategoryForCredential(credential as any) ||
                                BoostCategoryOptionsEnum.achievement
                            }
                            boostPageViewMode={BoostPageViewMode.Card}
                            useWrapper={false}
                            verifierState={false}
                            hideOptionsMenu
                            isPreview
                            className="shadow-xl"
                        />
                    </div>
                </div>
            ) : (
                <SkeletonCard />
            )}

            <p className="text-xs text-grayscale-400 text-center max-w-[230px] leading-relaxed">
                {credentialType
                    ? 'This is how your credential will look.'
                    : 'Pick a type to start designing your credential.'}
            </p>
        </div>
    );
};
