import React from 'react';
import { Updater } from 'use-immer';
import { ConsentFlowTerms } from '@learncard/types';
import { IonRippleEffect } from '@ionic/react';

import AnonymousIcon from '../../components/svgs/AnonymousIcon';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import Mail from 'learn-card-base/svgs/Mail';
import { ProfilePicture } from 'learn-card-base';
import {
    contractAnonImageSrc,
    getInfoFromContractKey,
    isSupportedPersonalField,
} from '../../helpers/contract.helpers';

type ConsentFlowWriteSharingItemProps = {
    term: ConsentFlowTerms['write']['credentials']['categories'][string];
    setTerm: Updater<ConsentFlowTerms['write']['credentials']['categories'][string]>;
    category?: string;
    required?: boolean;

    isAnonymous?: boolean;
    isPersonal?: boolean;

    hideIcon?: boolean;
    titleOverride?: string;
    infoText?: string;
    onClickOverride?: () => void;
};

const ConsentFlowWriteSharingItem: React.FC<ConsentFlowWriteSharingItemProps> = ({
    term,
    setTerm,
    category,
    required,

    isAnonymous,
    isPersonal,

    hideIcon,
    titleOverride,
    infoText,
    onClickOverride,
}) => {
    let { IconComponent, iconSrc, title, iconClassName, iconCircleClass } = category
        ? getInfoFromContractKey(category)
        : {};

    const isName = category?.toLowerCase() === 'name'; // special case
    const isEmail = category?.toLowerCase() === 'email'; // special case
    const isImage = category?.toLowerCase() === 'image'; // special case - could do "profile picture" here too, but pretty sure that's not actually functional
    const _isSupportedPersonalField = isSupportedPersonalField(category);

    if (isImage) {
        // overwrite "image" with "Profile Picture" for clarity
        title = 'Profile Picture';
    }

    let specialIcon: React.ReactNode;
    if (isName && isAnonymous) {
        specialIcon = (
            <div className="h-full w-full rounded-full bg-grayscale-900 p-[5px]">
                <AnonymousIcon />
            </div>
        );
    } else if (isImage && isAnonymous) {
        specialIcon = (
            <div className="h-full w-full rounded-full bg-grayscale-900 overflow-hidden">
                <img src={contractAnonImageSrc} className="h-full w-full" />
            </div>
        );
    } else if (isImage) {
        specialIcon = (
            <ProfilePicture
                customContainerClass="h-full w-full"
                customImageClass="h-full w-full object-cover"
            />
        );
    } else if (isName) {
        specialIcon = (
            <ProfilePicture
                customContainerClass="h-full w-full text-white font-medium text-2xl"
                customImageClass="h-full w-full object-cover"
                useInitialsOverride
            />
        );
    } else if (isEmail) {
        specialIcon = <Mail className="h-full w-full text-white p-[5px]" />;
    }

    const allowWord = isPersonal ? 'Share' : 'Allow';
    const denyWord = isPersonal ? 'Hide' : 'Deny';

    if (isPersonal && !_isSupportedPersonalField) {
        // if we don't actually support the field, just hide it
        return undefined;
    }

    const disabled = isAnonymous || (required && term);

    return (
        <li
            key={category}
            className={`border-b border-solid border-grayscale-200 last:border-none text-black ${
                disabled ? 'pointer-events-none' : 'hover:bg-grayscale-100 transition-colors'
            }`}
        >
            <button
                type="button"
                onClick={() => setTerm(!term)}
                className="w-full h-full flex items-center gap-[10px] py-[15px] px-[10px] relative overflow-hidden ion-activatable"
                disabled={disabled}
            >
                {!hideIcon && (
                    <div
                        className={`flex items-center justify-center h-[40px] w-[40px] rounded-full shrink-0 ${iconCircleClass}`}
                        role="presentation"
                    >
                        {specialIcon ? (
                            specialIcon
                        ) : iconSrc ? (
                            <img src={iconSrc} className="h-[30px] w-[30px] text-white" />
                        ) : (
                            <IconComponent className={`h-[30px] ${iconClassName}`} />
                        )}
                    </div>
                )}
                {/* <section className="flex flex-col flex-1 items-start"> */}
                {/* <output
                        className={`text-sm font-semibold ${
                            term ? 'text-emerald-800' : 'text-grayscale-600'
                        }`}
                    >
                        {term ? 'Allow Access' : 'Deny Access'}
                    </output> */}

                <div className="flex flex-col flex-1 items-start">
                    <h4 className="text-[17px] text-grayscale-900 font-notoSans font-[600] leading-[24px] tracking-[0.25px] line-clamp-1 grow text-left capitalize">
                        {titleOverride ?? title}
                    </h4>

                    {required && (
                        <span className="text-[14px] text-grayscale-600 text-left self-start">
                            Required
                        </span>
                    )}

                    {!required && infoText && (
                        <p className="text-grayscale-600 text-[14px] font-notoSans text-left">
                            {infoText}
                        </p>
                    )}
                </div>
                {/* </section> */}

                <section className="flex items-center">
                    {term && !isAnonymous && (
                        <span className="text-emerald-700 font-notoSans text-[14px] font-[600]">
                            {allowWord}
                        </span>
                    )}
                    {(!term || isAnonymous) && (
                        <span className="text-grayscale-600 font-notoSans text-[14px] font-[600]">
                            {isAnonymous && _isSupportedPersonalField ? 'Anonymized' : denyWord}
                        </span>
                    )}

                    {!disabled && (
                        <SkinnyCaretRight className="h-[20px] w-[20px] text-grayscale-400" />
                    )}
                </section>

                {!disabled && <IonRippleEffect />}
            </button>
        </li>
    );
};

export default ConsentFlowWriteSharingItem;
