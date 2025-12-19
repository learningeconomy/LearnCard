import React, { useState, useEffect } from 'react';
import { GenericCard } from '@learncard/react';
import { useIonModal } from '@ionic/react';
import {
    getImageUrlFromCredential,
    getCredentialName,
} from 'learn-card-base/helpers/credentialHelpers';
import { VC } from '@learncard/types';
import {
    CredentialCategoryEnum,
    VCModal,
    categoryMetadata,
    useGetResolvedCredential,
} from 'learn-card-base';

type GenericCardWrapperProps = {
    vc?: VC;
    uri: string;
    selectAll?: boolean | null | undefined;
    showChecked?: boolean;
    customHeaderClass?: string;
    onClick?: () => void;
    customThumbSrc?: string;
    useCardModal?: boolean;
    overrideIssueeName?: string;
    initialCheckmarkState?: boolean;
};

const GenericCardWrapper: React.FC<GenericCardWrapperProps> = ({
    vc: _vc,
    uri,
    selectAll,
    showChecked = true,
    useCardModal = false,
    onClick,
    customThumbSrc,
    overrideIssueeName,
    customHeaderClass = 'bg-spice-600',
    initialCheckmarkState = true,
}) => {
    const { data: resolvedCredential } = useGetResolvedCredential(uri, !_vc);
    const vc = resolvedCredential || _vc;
    const [selected, setSelected] = useState<boolean | null | undefined>(initialCheckmarkState);
    const [present, dismiss] = useIonModal(VCModal, {
        overrideIssueeName,
        vc: vc,
        onDismiss: (data: string, role: string) => dismiss(data, role),
    });

    useEffect(() => {
        if (selectAll !== null) setSelected(selectAll);
    }, [selectAll]);

    const handleClick = () => {
        if (useCardModal) present();
        setSelected(!selected);
        onClick?.();
    };

    const defaultImg = categoryMetadata[CredentialCategoryEnum.achievement].defaultImageSrc;
    const thumbImg = customThumbSrc || (vc && getImageUrlFromCredential(vc)) || defaultImg;
    const thumbClass = thumbImg ? 'generic-lc-thumb bg-white' : 'generic-lc-thumb bg-spice-300';
    const cardTitle = vc && getCredentialName(vc);

    useEffect(() => {
        setSelected(initialCheckmarkState);
    }, [initialCheckmarkState]);

    return (
        <GenericCard
            onClick={handleClick}
            className="bg-white text-black z-[1000] mt-[15px]"
            customHeaderClass={customHeaderClass}
            thumbImgSrc={thumbImg}
            customThumbClass={thumbClass}
            title={cardTitle}
            showChecked={showChecked}
            checkStatus={selected}
            flipped
            type={null} // otherwise type will defualt to achievement and override the 'header' color
        />
    );
};

export default GenericCardWrapper;
