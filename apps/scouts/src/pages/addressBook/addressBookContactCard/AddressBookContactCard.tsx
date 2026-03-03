import React from 'react';
import { useHistory } from 'react-router-dom';
import { ProfilePicture, useCurrentUser, useModal, ModalTypes } from 'learn-card-base';

import SlimCaretRight from '../../../components/svgs/SlimCaretRight';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import QrCodeUserCardModal from '../../../components/qrcode-user-card/QRCodeUserCard';
import { BrandingEnum } from 'learn-card-base';

const AddressBookContactCard: React.FC = () => {
    const currentUser = useCurrentUser();
    const { newModal, closeModal } = useModal();
    const history = useHistory();

    const handleQrCodeClick = () => {
        newModal(
            <QrCodeUserCardModal
                branding={BrandingEnum.scoutPass}
                history={history}
                handleQRCodeCardModal={() => closeModal()}
                qrOnly
            />,
            { sectionClassName: '!max-w-[400px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    return (
        <div className="bg-white rounded-[15px] shadow-[0px 2px 4px 0px rgba(0, 0, 0, 0.25)] w-full max-w-[400px] sm:max-w-[600px] mx-auto my-4 rounded-2xl flex px-[10px] py-[15px]">
            <ProfilePicture
                customContainerClass="flex justify-center items-center h-[50px] w-[50px] rounded-full overflow-hidden border-white border-solid border-[3px] text-white font-medium text-xl min-w-[50px] min-h-[50px]"
                customImageClass="flex justify-center items-center h-[50px] w-[50px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[50px] min-h-[50px]"
                customSize={120}
            />
            <div className="flex flex-col justify-center ml-[5px]">
                <p className="font-notoSans text-[17px] font-semibold text-grayscale-900">
                    {currentUser?.name}
                </p>
                <span className="font-notoSans text-[12px] font-semibold text-grayscale-600">
                    My Contact Card
                </span>
            </div>
            <button onClick={handleQrCodeClick} className="flex items-center ml-auto">
                <section className="flex justify-center items-center h-9 w-9">
                    <QRCodeScanner className="h-[70%]" />
                </section>
                <SlimCaretRight className="text-grayscale-400 w-[24px] h-auto" />
            </button>
        </div>
    );
};

export default AddressBookContactCard;
