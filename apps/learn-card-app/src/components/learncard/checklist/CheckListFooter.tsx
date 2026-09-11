import React from 'react';

import { IonFooter } from '@ionic/react';

import { useModal } from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';

const CheckListFooter: React.FC<{}> = ({}) => {
    const { closeModal } = useModal();

    return (
        <IonFooter
            mode="ios"
            className="lc-content-owns-bottom w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 left-0 bg-white"
            style={{
                bottom: 0,
                paddingBottom: 'var(--lc-overlay-inset-bottom, var(--ion-safe-area-bottom, 0px))',
                maxHeight:
                    'calc(100px + var(--lc-overlay-inset-bottom, var(--ion-safe-area-bottom, 0px)))',
            }}
        >
            <div className="w-full flex items-center justify-center">
                <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                    <button
                        onClick={closeModal}
                        className=" py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2"
                    >
                        {m['common.close']()}
                    </button>
                </div>
            </div>
        </IonFooter>
    );
};

export default CheckListFooter;
