import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { documentTextOutline } from 'ionicons/icons';
import type { VC } from '@learncard/types';
import type { CredentialCategoryEnum } from 'learn-card-base';
import {
    getDefaultCategoryForCredential,
    getImageUrlFromCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import useTheme from '../../theme/hooks/useTheme';

/** Display-only thumbnail: never modifies the signed credential used for sharing. */
export const ShareCredentialThumbnail = ({
    credential,
    category,
}: {
    credential?: VC;
    category?: string;
}) => {
    const { getThemedCategory } = useTheme();
    const resolvedCategory =
        category || (credential && getDefaultCategoryForCredential(credential));
    const themed = resolvedCategory
        ? getThemedCategory(resolvedCategory as CredentialCategoryEnum)
        : undefined;
    const CategoryIcon = themed?.icons.IconWithShape ?? themed?.icons.Icon;
    const image = credential ? getImageUrlFromCredential(credential) : undefined;
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [image]);
    const showImage = Boolean(image) && !failed;
    const background = themed?.colors.primaryColor;
    return (
        <span
            aria-hidden="true"
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl p-2 ${background ? 'bg-' + background : 'bg-grayscale-100'}`}
        >
            {showImage ? (
                <img
                    src={image}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-full w-full rounded-xl bg-white object-contain"
                    onError={() => setFailed(true)}
                />
            ) : CategoryIcon ? (
                <CategoryIcon className="h-10 w-10" />
            ) : (
                <IonIcon icon={documentTextOutline} className="h-6 w-6 text-grayscale-600" />
            )}
            {showImage && CategoryIcon && (
                <span className="absolute -bottom-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-white">
                    <CategoryIcon className="h-5 w-5" />
                </span>
            )}
        </span>
    );
};
