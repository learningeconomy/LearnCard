import React from 'react';
import { createPortal } from 'react-dom';

import { BoostCategoryOptionsEnum, boostCategoryMetadata, useModal } from 'learn-card-base';

import LinkChain from 'learn-card-base/svgs/LinkChain';
import CredentialGeneralPlus from '../../../svgs/CredentialGeneralPlus';
import BoostAddressBookContactItem from '../../boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBookContactItem';

import { BoostCMSState } from '../../boost';
import { BoostAddressBookEditMode } from '../../boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBook';
import { BoostCMSIssueTo, ShortBoostState } from '../../boost';

type ShortBoostSomeoneScreenProps = {
    boostUri: string;
    handleOpenModal: () => void;
    handleBoostSomeone: () => void;
    issuedTo: BoostCMSIssueTo[];
    state: ShortBoostState;
    setState: React.Dispatch<React.SetStateAction<ShortBoostState>>;
    shareableCodeState?: BoostCMSState;
    handleGenerateLink: () => void;
    category: BoostCategoryOptionsEnum;
    showBoostContext?: boolean;
    boostName?: string;
};

const ShortBoostSomeoneScreen: React.FC<ShortBoostSomeoneScreenProps> = ({
    boostUri,
    handleOpenModal,
    handleBoostSomeone,
    issuedTo,
    state,
    setState,
    shareableCodeState,
    handleGenerateLink,
    category,
    showBoostContext = false,
    boostName,
}) => {
    const renderIssuedTo = issuedTo?.map((contact, index) => {
        return (
            <BoostAddressBookContactItem
                state={state}
                setState={setState}
                contact={contact}
                key={index}
                mode={BoostAddressBookEditMode.delete}
                // _issueTo={_issueTo}
                // _setIssueTo={_setIssueTo}
                version="sleek"
            />
        );
    });
    const { closeModal } = useModal();
    const sectionPortal = document.getElementById('section-cancel-portal');

    const color = boostCategoryMetadata[category]?.color ?? 'grayscale-900';

    const issueButtonDisabled = issuedTo.length === 0;

    return (
        <>
            <div className="p-[20px] bg-white rounded-[15px]">
                {showBoostContext && boostName && (
                    <div className="mb-3 pb-3 border-b border-grayscale-200">
                        <p className="text-xs font-medium text-grayscale-600 uppercase tracking-wide mb-1">
                            Sending Boost
                        </p>
                        <div className="flex items-center gap-2">
                            <p className="text-base font-semibold text-grayscale-900 truncate">
                                {boostName}
                            </p>
                        </div>
                    </div>
                )}
                <button
                    className="flex items-center gap-[10px] py-[10px] pl-[20px] pr-[10px] bg-grayscale-100 rounded-[20px] text-grayscale-900 font-poppins text-[20px] leading-[130%] tracking-[-0.25px] w-full"
                    onClick={() => handleOpenModal()}
                >
                    Select Recipients
                    <CredentialGeneralPlus className="w-[44px] h-[44px] flex-shrink-0 ml-auto" />
                </button>
                {renderIssuedTo.length > 0 && <div className="mt-[10px]">{renderIssuedTo}</div>}
            </div>
            {sectionPortal &&
                createPortal(
                    <div className="flex flex-col justify-center items-center relative !border-none max-w-[500px]">
                        <button
                            onClick={handleBoostSomeone}
                            className={`flex gap-[5px] items-center justify-center bg-${
                                color || 'grayscale-900'
                            } disabled:bg-grayscale-400 text-white font-poppins text-[17px] font-[600] leading-[130%] tracking-[-0.25px] py-[10px] px-[20px] w-full rounded-[30px] shadow-bottom-4-4`}
                            disabled={issueButtonDisabled}
                        >
                            {issuedTo.length === 0 && 'Issue'}
                            {issuedTo.length > 0 &&
                                `Issue to ${issuedTo.length} ${
                                    issuedTo.length === 1 ? 'person' : 'people'
                                }`}
                            <CredentialGeneralPlus
                                className={`w-[30px] h-[30px] text-${
                                    issueButtonDisabled ? 'grayscale-400' : 'grayscale-800'
                                }`}
                                plusColor="currentColor"
                            />
                        </button>
                        <button
                            onClick={handleGenerateLink}
                            className="flex items-center gap-[5px] justify-center bg-white rounded-[30px] px-[20px] py-[10px] text-grayscale-800 font-poppins text-[17px] leading-[130%] tracking-[-0.25px] w-full mt-[10px] shadow-bottom-4-4"
                        >
                            Generate Link
                            <LinkChain className="h-[25px] w-[25px]" version="thin" />
                        </button>
                        <button
                            onClick={closeModal}
                            className="bg-white text-grayscale-800 text-[17px] font-poppins py-2 rounded-[30px] px-[20px] py-[10px] w-full h-full leading-[130%] tracking-[-0.25px] mt-[10px] shadow-bottom-4-4"
                        >
                            Close
                        </button>
                    </div>,
                    sectionPortal
                )}
        </>
    );
};

export default ShortBoostSomeoneScreen;
