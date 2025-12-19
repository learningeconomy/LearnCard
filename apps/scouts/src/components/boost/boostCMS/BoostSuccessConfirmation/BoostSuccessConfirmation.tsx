import React from 'react';
import { useHistory } from 'react-router-dom';

import { IonRow } from '@ionic/react';
import BoostCMSAppearanceController from '../boostCMSForms/boostCMSAppearance/BoostCMSAppearanceController';

import { BoostCMSState } from '../../boost';
import {
    BOOST_CATEGORY_TO_WALLET_ROUTE,
    CATEGORY_TO_SUBCATEGORY_LIST,
} from '../../boost-options/boostOptions';
import { BoostCategoryOptionsEnum, UserProfilePicture } from 'learn-card-base';
import BoostCMSIDCard from '../../boost-id-card/BoostIDCard';

export const BoostSuccessConfirmation: React.FC<{
    state: BoostCMSState;
    handlePreview: () => void;
    handleClose?: () => void;
}> = ({ state, handlePreview, handleClose }) => {
    const history = useHistory();

    const defaultTitle =
        CATEGORY_TO_SUBCATEGORY_LIST?.[state?.basicInfo?.type].find(
            options => options?.type === state?.basicInfo?.achievementType
        )?.title ?? '';

    const isID = state?.basicInfo?.type === BoostCategoryOptionsEnum.id;
    const isMembership = state?.basicInfo?.type === BoostCategoryOptionsEnum.membership;

    return (
        <IonRow className="w-full flex flex-col items-center justify-center">
            <div className="w-full bg-white rounded-[20px] shadow-3xl max-w-[600px]">
                <div className="flex items-center justify-center">
                    {isID || isMembership ? (
                        <IonRow className="w-full flex flex-col items-center justify-center">
                            <BoostCMSIDCard
                                state={state}
                                idClassName="p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]"
                                idFooterClassName="p-0 m-0 boost-id-preview-footer mb-4"
                                customIssuerThumbContainerClass="id-card-issuer-thumb-preview-container"
                            />
                        </IonRow>
                    ) : (
                        <BoostCMSAppearanceController
                            state={state}
                            showEditButton={false}
                            customHeaderClass="w-[95%]"
                        />
                    )}
                </div>

                <div className="w-full flex items-end justify-center mb-6">
                    <h3 className="text-grayscale-800 text-4xl text-center">Sent!</h3>
                </div>
                <div className="w-full flex flex-col items-center justify-center mb-4">
                    <h3 className="text-grayscale-800 text-3xl text-center">
                        {state?.basicInfo?.name || defaultTitle}
                    </h3>
                    <h3 className="text-grayscale-800 text-base text-center mt-2">
                        <span className="text-grayscale-800 font-semibold">
                            {state?.basicInfo?.type}
                        </span>{' '}
                        issued to{' '}
                        <span className="text-grayscale-800 font-semibold">
                            {state?.issueTo?.length || 0}{' '}
                            {state?.issueTo?.length === 1 ? 'person' : 'people'}
                        </span>
                    </h3>
                    <section className="boost-small-card-body flex justify-center items-center text-center text-[14px] overflow-hidden text-grayscale-500 p-[10px]">
                        {state?.issueTo?.map((recipient, index) => {
                            return (
                                <div
                                    key={index}
                                    className="profile-thumb-img border-[2px] border-white border-solid  vc-issuee-image h-[50px] w-[50px] rounded-full overflow-hidden mx-[-5px]"
                                >
                                    <UserProfilePicture
                                        customContainerClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden text-white font-medium text-4xl mr-3"
                                        customImageClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden object-cover"
                                        user={recipient}
                                        customSize={500}
                                    />
                                </div>
                            );
                        })}
                        {state?.issueTo?.length > 3 && (
                            <span className="small-boost-issue-count ml-[10px] font-semibold">
                                +{state?.issueTo?.length - 3}
                            </span>
                        )}
                    </section>
                </div>
                <div className="w-full flex flex-col items-center justify-center pb-2">
                    <button
                        onClick={handlePreview}
                        className="flex items-center font-medium justify-center text-white rounded-full px-[64px] py-[12px] bg-grayscale-900 text-2xl w-full shadow-3xl max-w-[325px] mb-4"
                    >
                        View Boost
                    </button>
                    <button
                        onClick={() => {
                            if (!handleClose) {
                                history.push(
                                    `/${
                                        BOOST_CATEGORY_TO_WALLET_ROUTE?.[state?.basicInfo?.type]
                                    }?managed=true`
                                );
                            } else {
                                handleClose?.();
                            }
                        }}
                        className="flex items-center font-medium justify-center text-white rounded-full px-[64px] py-[12px] bg-indigo-500 text-2xl w-full shadow-3xl max-w-[325px] mb-4"
                    >
                        Return To Wallet
                    </button>
                </div>
            </div>
        </IonRow>
    );
};

export default BoostSuccessConfirmation;
