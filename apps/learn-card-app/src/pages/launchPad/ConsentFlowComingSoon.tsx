import React from 'react';

import { ConsentFlowContractDetails } from '@learncard/types';

import { IonCol, IonRow, IonSkeletonText } from '@ionic/react';
import RightArrow from 'learn-card-base/svgs/RightArrow';
import HandshakeIcon from '../../components/svgs/HandshakeIcon';

import { BoostCategoryOptionsEnum } from '../../components/boost/boost-options/boostOptions';
import { useContract } from 'learn-card-base';

import useTheme from '../../theme/hooks/useTheme';

export type ConsentFlowWriteAccessType = {
    [BoostCategoryOptionsEnum.socialBadge]: boolean;
    [BoostCategoryOptionsEnum.skill]: boolean;
    [BoostCategoryOptionsEnum.achievement]: boolean;
    [BoostCategoryOptionsEnum.learningHistory]: boolean;
    [BoostCategoryOptionsEnum.course]?: boolean;
    [BoostCategoryOptionsEnum.job]?: boolean;
    [BoostCategoryOptionsEnum.id]: boolean;
    [BoostCategoryOptionsEnum.workHistory]: boolean;
    [BoostCategoryOptionsEnum.membership]: boolean;
};

export type ConsentFlowReadAccessType = ConsentFlowWriteAccessType & {
    name: boolean;
    age: boolean;
    race: boolean;
    gender: boolean;
    postalCode: boolean;
    language: boolean;
};

type ConsentFlowComingSoonProps = {
    contract?: ConsentFlowContractDetails;
    contractUri?: string;
};

const ConsentFlowComingSoon: React.FC<ConsentFlowComingSoonProps> = ({
    contract: _contract,
    contractUri,
}) => {
    const { data: contractDetails } = useContract(contractUri);
    const contract = _contract || contractDetails;

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <section className="w-full flex flex-col gap-[20px] items-center px-[20px] py-[30px] bg-white shadow-bottom rounded-[24px] max-w-[350px] disable-scrollbars safe-area-top-margin">
            <div className="w-full flex items-center justify-center pt-2">
                <h6 className="tracking-[12px] text-base font-bold text-black">LEARNCARD</h6>
            </div>

            <div className="w-full flex flex-col items-center justify-center mt-8 px-4">
                <div className="h-[60px] w-[60px] rounded-[12px] overflow-hidden">
                    {contract?.contract ? (
                        <img
                            src={contract?.image}
                            alt={contract?.name}
                            className="h-full w-full m-0"
                        />
                    ) : (
                        <IonSkeletonText animated className="h-full w-full m-0" />
                    )}
                </div>
                {contract?.contract ? (
                    <h3 className="font-normal text-xl text-black mt-2 font-poppins tracking-wide">
                        {contract?.name}
                    </h3>
                ) : (
                    <IonSkeletonText animated className="mt-2 w-64" />
                )}
                {contract?.contract ? (
                    <>
                        {contract?.subtitle && (
                            <p className="text-center text-sm font-poppins text-grayscale-800 italic mt-2">
                                {contract.subtitle}
                            </p>
                        )}
                        <p className="text-center text-sm font-semibold px-[16px] text-grayscale-800 mt-4">
                            {contract?.description}
                        </p>
                    </>
                ) : (
                    <>
                        <IonSkeletonText animated className="mt-4 w-[calc(100%-32px)]" />
                        <IonSkeletonText animated className="w-[calc(100%-32px)]" />
                    </>
                )}
            </div>

            <div className="w-full text-center flex flex-col items-center justify-center">
                <HandshakeIcon className="text-grayscale-900 w-[40px] h-[40px] mt-4" />
                <button
                    onClick={() => {}}
                    className={`text-${primaryColor} font-bold text-base flex mt-2 items-center justify-center disabled:opacity-50`}
                    disabled
                >
                    Sync New Data <RightArrow className="w-[20px] h-[20px]" />
                </button>
                <button
                    onClick={() => {}}
                    className={`text-${primaryColor} font-bold text-base flex mt-2 items-center justify-center disabled:opacity-50`}
                    disabled
                >
                    Edit Access <RightArrow className="w-[20px] h-[20px]" />
                </button>
                <button
                    onClick={() => {}}
                    className={`text-${primaryColor} font-bold text-base flex mt-2 items-center justify-center disabled:opacity-50`}
                    disabled
                >
                    Sharing
                    <RightArrow className="w-[20px] h-[20px]" />
                </button>
            </div>

            <div className="w-full flex items-center justify-center flex-col mt-8">
                <button
                    onClick={async () => {}}
                    disabled
                    type="button"
                    className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-grayscale-900 font-poppins text-xl w-full shadow-3xl normal max-w-[320px] disabled:opacity-50"
                >
                    Coming Soon
                </button>
            </div>

            <div className="w-full flex items-center justify-center mt-8">
                <div className="bg-grayscale-200 w-[90%] h-[1px]" />
            </div>

            <IonRow className="flex items-center justify-center mt-4 w-full">
                <IonCol className="flex flex-col items-center justify-center text-center">
                    <p className="text-center text-sm font-normal text-grayscale-600">
                        All connections are{' '}
                        <b>
                            <u>encrypted.</u>
                        </b>
                    </p>
                </IonCol>
            </IonRow>
        </section>
    );
};

export default ConsentFlowComingSoon;
