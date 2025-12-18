import React from 'react';
import Sparkles from '../../assets/images/purple-sparkles.gif';
import { ConsentFlowContractDetails } from '@learncard/types';
import { IonSpinner } from '@ionic/react';
import { LaunchPadAppListItem } from 'learn-card-base';

type ConsentFlowConnectingProps = {
    contractDetails: ConsentFlowContractDetails;
    app?: LaunchPadAppListItem;

    tempHandleBack: () => void;
};

const ConsentFlowConnecting: React.FC<ConsentFlowConnectingProps> = ({
    contractDetails,
    app,

    tempHandleBack,
}) => {
    const { name: contractName, image: contractImage } = contractDetails ?? {};
    const { name: appName, img: appImage } = app ?? {};

    const name = appName ?? contractName;
    const image = appImage ?? contractImage;

    return (
        <div
            onClick={tempHandleBack}
            className="w-full flex flex-col justify-center items-center gap-[60px] bg-white rounded-[24px] px-[30px] pt-[60px] pb-[40px] shadow-box-bottom max-w-[340px] mx-auto"
        >
            <div className="relative w-full flex items-center justify-center">
                <img
                    src={image}
                    className="h-[70px] w-[70px] rounded-full object-cover z-50 bg-white border-white border-solid border-[6px] box-content"
                />

                <img src={Sparkles} alt="Sparkles" className="absolute h-[182px] w-[182px] z-20" />
                <IonSpinner
                    name="crescent"
                    style={{
                        color: '#6366F1',
                        '--spinner-duration': '6s', // ... this does nothing. Was trying to slow it down
                    }}
                    className="z-[100] absolute h-[94px] w-[94px]"
                />
            </div>

            <span className="font-notoSans text-grayscale-900 text-[17px] font-[600] leading-[24px] tracking-[0.25px]">
                Connecting {name}...
            </span>
        </div>
    );
};

export default ConsentFlowConnecting;
