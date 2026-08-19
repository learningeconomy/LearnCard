import React from 'react';

import X from 'learn-card-base/svgs/X';
import { IonFooter } from '@ionic/react';
import { EndorsmentThumbWithCircle } from 'learn-card-base/svgs/EndorsementThumb';

import { useModal } from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';

const EndorsementFormFooter: React.FC<{
    isDisabled?: boolean;
    isLoading?: boolean;
    className?: string;
    showDeclineButton?: boolean;
    handleEndorsementSubmit?: () => void;
}> = ({ isDisabled, isLoading, className, showDeclineButton = false, handleEndorsementSubmit }) => {
    const { closeModal } = useModal();

    let iconStyles = '';
    if (isDisabled) iconStyles = 'text-grayscale-300';
    else iconStyles = 'text-teal-400';

    return (
        <IonFooter
            mode="ios"
            className={`lc-content-owns-bottom w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 left-0 bg-white ${className}`}
            style={{
                bottom: 0,
                paddingBottom: 'var(--lc-overlay-inset-bottom, var(--ion-safe-area-bottom, 0px))',
                maxHeight:
                    'calc(100px + var(--lc-overlay-inset-bottom, var(--ion-safe-area-bottom, 0px)))',
            }}
        >
            <div className="w-full flex items-center justify-center">
                <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                    {showDeclineButton ? (
                        <button
                            onClick={closeModal}
                            className="min-w-[46px] min-h-[46px] bg-white rounded-full flex items-center justify-center mr-2 shadow-soft-bottom"
                        >
                            <X className="w-[20px] h-auto text-grayscale-900" />
                        </button>
                    ) : (
                        <button
                            onClick={closeModal}
                            className="py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-poppins text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2"
                        >
                            {m['common.back']()}
                        </button>
                    )}
                    {showDeclineButton && (
                        <button className="py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-poppins text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2">
                            {m['endorsement.form.footer.decline']()}
                        </button>
                    )}
                    <button
                        disabled={isDisabled || isLoading}
                        onClick={handleEndorsementSubmit}
                        className={`py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-poppins text-[17px] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] justify-center mr-2 ${
                            isDisabled || isLoading ? 'bg-grayscale-300' : 'bg-teal-400'
                        }`}
                    >
                        {isLoading
                            ? m['endorsement.form.footer.sending']()
                            : m['endorsement.form.footer.endorse']()}{' '}
                        <EndorsmentThumbWithCircle className={`w-6 h-6 ${iconStyles}`} />
                    </button>
                </div>
            </div>
        </IonFooter>
    );
};

export default EndorsementFormFooter;
