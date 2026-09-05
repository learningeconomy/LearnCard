import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import type { LCNVisibleProfile, VC } from '@learncard/types';

import { BoostCategoryOptionsEnum, BoostPageViewMode, useGetConnections } from 'learn-card-base';
import {
    getDefaultCategoryForCredential,
    getProfileIdFromLCNDidWeb,
} from 'learn-card-base/helpers/credentialHelpers';
import { deriveIssuerTrustProfile } from 'learn-card-base/hooks/useIssuerContext';
import { useKnownDIDRegistry } from 'learn-card-base/hooks/useRegistry';
import { BoostEarnedCard } from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import type { SimpleCredentialType } from '../../../components/simple-send/simpleSend.helpers';
import type { Recipient, RecipientMode } from './recipientTypes';
import { createPreviewIssuerContext, type PreviewRegistrySource } from './previewIssuerContext';
import * as m from '../../../paraglide/messages.js';

interface HeroCanvasProps {
    credential: Record<string, unknown> | null;
    credentialType: SimpleCredentialType | null;
    cardTitle?: string;
    hasImage?: boolean;
    recipientMode?: RecipientMode;
    recipients?: Recipient[];
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
    recipientMode,
    recipients = [],
}) => {
    const popping = useChangePulse(cardTitle);
    const glowing = useChangePulse(hasImage ? 'has-image' : '');
    const t = useT();
    const { data: connections = [] } = useGetConnections();
    const issuer =
        credential?.issuer && typeof credential.issuer === 'object'
            ? (credential.issuer as Record<string, unknown>)
            : undefined;
    const issuerDid =
        typeof credential?.issuer === 'string'
            ? credential.issuer
            : typeof issuer?.id === 'string'
            ? issuer.id
            : '';
    const issuerName = typeof issuer?.name === 'string' ? issuer.name : undefined;
    const issuerImage = typeof issuer?.image === 'string' ? issuer.image : undefined;
    const registry = useKnownDIDRegistry(issuerDid || undefined);
    const registrySource =
        registry.data?.source === 'trusted' ||
        registry.data?.source === 'untrusted' ||
        registry.data?.source === 'unknown'
            ? (registry.data.source as PreviewRegistrySource)
            : undefined;
    const category =
        credential &&
        (getDefaultCategoryForCredential(credential as unknown as VC) ||
            BoostCategoryOptionsEnum.achievement);
    const issuerContext = useMemo(() => {
        if (!credential || !issuerDid || !recipientMode) return undefined;

        const issuerProfile: LCNVisibleProfile = {
            profileId: getProfileIdFromLCNDidWeb(issuerDid) ?? issuerDid,
            displayName: issuerName ?? issuerDid,
            shortBio: '',
            ...(issuerImage ? { image: issuerImage } : {}),
        };

        return createPreviewIssuerContext({
            issuerDid,
            issuerProfile,
            trustProfile: deriveIssuerTrustProfile(credential as unknown as VC),
            registrySource,
            recipientMode,
            recipients,
            connections,
        });
    }, [
        connections,
        credential,
        issuerDid,
        issuerImage,
        issuerName,
        recipientMode,
        recipients,
        registrySource,
    ]);
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
                            credential={credential as unknown as VC}
                            categoryType={category}
                            boostPageViewMode={BoostPageViewMode.Card}
                            useWrapper={false}
                            verifierState={false}
                            issuerContextOverride={issuerContext}
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
                    ? m['issueFlow.preview.willLook']()
                    : m['issueFlow.preview.pickToStart']()}
            </p>
        </div>
    );
};
