import React, { useState } from 'react';
import { getCategoryColor } from '../../helpers/credential.helpers';
import { VC } from '@learncard/types';
import { BoostAchievementCredential, LCCategoryEnum } from '../../types';
import CertificateFrontFace from './CertificateFrontFace';

type CertificateDisplayCardProps = {
    credential: VC | BoostAchievementCredential;
    categoryType?: LCCategoryEnum;
};

export const CertificateDisplayCard: React.FC<CertificateDisplayCardProps> = ({
    credential,
    categoryType,
}) => {
    const [isFront, setIsFront] = useState(true);

    const credentialPrimaryColor = getCategoryColor(categoryType) ?? 'emerald-500';

    return (
        <section className="border-solid border-[5px] border-grayscale-200 bg-white rounded-[30px] p-[13px] relative max-w-[300px]">
            {isFront && (
                <CertificateFrontFace credential={credential} categoryType={categoryType} />
            )}

            <button
                className={`bg-${credentialPrimaryColor} text-white font-sacramento font-[600] py-[5px] px-[15px] rounded-full absolute bottom-[-50px] right-0 left-0 min-w-[200px]`}
                onClick={() => setIsFront(!isFront)}
            >
                FLIP IT
            </button>
        </section>
    );
};

export default CertificateDisplayCard;
