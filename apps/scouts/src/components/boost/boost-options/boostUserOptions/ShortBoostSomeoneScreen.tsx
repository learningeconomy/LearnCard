import React, { useState, useEffect } from 'react';

import { IonCol, IonGrid } from '@ionic/react';

import Plus from 'learn-card-base/svgs/Plus';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import BoostAddressBookContactItem from '../../boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBookContactItem';
import { ModalTypes, useModal, BoostUserTypeEnum } from 'learn-card-base';
import { BoostCMSIssueTo, ShortBoostState } from '../../boost';
import { BoostAddressBookEditMode } from '../../boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBook';
import BoostSearch from '../../boost-search/BoostSearch';
import BoostShareableCode from '../../boostCMS/boostCMSForms/boostCMSIssueTo/BoostShareableCode';
import LinkChain from 'learn-card-base/svgs/LinkChain';
import { BoostCMSState } from '../../boost';

type ShortBoostSomeoneScreenProps = {
    boostUri: string;
    profileId: string;
    history: any;
    handleCloseModal: () => void;
    handleOpenModal?: () => void;
    handleBoostSomeone: (state?: ShortBoostState) => void;
    issuedTo: BoostCMSIssueTo[];
    state: ShortBoostState;
    setState: React.Dispatch<React.SetStateAction<ShortBoostState>>;
    boostStatus?: string;
    shareableCodeState?: BoostCMSState;
    ignoreBoostSearchRestriction?: boolean;
};

const ShortBoostSomeoneScreen: React.FC<ShortBoostSomeoneScreenProps> = ({
    history,
    boostUri,
    profileId,
    handleCloseModal,
    handleBoostSomeone,
    issuedTo,
    state,
    setState,
    boostStatus,
    shareableCodeState,
    ignoreBoostSearchRestriction,
}) => {
    const [localState, setLocalState] = useState(state);
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const _handleSetState = (value: any) => {
        setLocalState(value);
        setState(value);
    };

    useEffect(() => {
        setLocalState(state);
    }, [state]);

    const presentBoostSomeoneModal = () => {
        newModal(
            <BoostSearch
                boostUserType={BoostUserTypeEnum.someone}
                handleCloseModal={closeModal}
                handleCloseUserOptionsModal={closeModal}
                cssClass="boost-search-modal safe-area-top-margin"
                state={localState}
                setState={_handleSetState}
                history={history}
                preserveStateIssueTo={false}
                ignoreBoostSearchRestriction={ignoreBoostSearchRestriction}
            />,
            {
                className: '!p-0',
                sectionClassName: '!p-0',
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    //i know the issue is because renderIssuedTo is coming back empty once you save the contact
    //what I don't understand is why because when I logged state over in ScoutConnectModal it shows up properly
    const renderIssuedTo = localState.issueTo?.map((contact, index) => {
        return (
            <BoostAddressBookContactItem
                state={localState}
                setState={_handleSetState}
                contact={contact}
                key={index}
                mode={BoostAddressBookEditMode.delete}
                // _issueTo={_issueTo}
                // _setIssueTo={_setIssueTo}
            />
        );
    });

    return (
        <section>
            <IonGrid className="ion-padding">
                <IonCol className="w-full flex items-center justify-between mt-8">
                    <div className="boost-issue-container w-full flex items-center justify-between mx-[20px] text-grayscale-900">
                        <p className="boost-issue-to-text text-[25px]">Add Someone</p>
                        <div
                            className="flex-shrink-0 cursor-pointer"
                            onClick={() => presentBoostSomeoneModal()}
                        >
                            <Plus className="w-8 h-auto round-bottom-shadow-btn w-[50px] h-[50px] flex-shrink-0 p-[8px] flex justify-center items-center" />
                        </div>
                    </div>
                </IonCol>
                <IonCol>{renderIssuedTo}</IonCol>
                <IonCol className="w-full flex flex-col items-center justify-center mt-[20px]">
                    <button
                        onClick={() => handleBoostSomeone(localState)}
                        className="flex items-center justify-center bg-sp-purple-base rounded-full px-[18px] py-[12px] font-medium text-white text-2xl w-full shadow-lg disabled:opacity-[50%]"
                        disabled={localState?.issueTo.length === 0}
                    >
                        <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" /> Send
                    </button>
                    {boostStatus === 'LIVE' && (
                        <IonCol className="w-full flex items-center justify-center mt-[40px] p-0">
                            <button
                                onClick={() => {
                                    newModal(
                                        <BoostShareableCode
                                            boostUri={boostUri}
                                            state={shareableCodeState}
                                            customClassName="bg-white justify-start items-start p-0 m-0"
                                            defaultGenerateLinkToggleState
                                        />
                                    );
                                }}
                                className="flex items-center font-medium justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg normal tracking-wide"
                            >
                                <LinkChain className="ml-[5px] h-[30px] w-[30px] mr-2" /> Generate
                                Link
                            </button>
                        </IonCol>
                    )}
                </IonCol>
                <div className="w-full flex items-center justify-center mt-8">
                    <button
                        onClick={() => handleCloseModal()}
                        className="text-grayscale-900 text-center text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </IonGrid>
        </section>
    );
};

export default ShortBoostSomeoneScreen;
