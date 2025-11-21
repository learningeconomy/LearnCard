import React from 'react';
import { IonFooter, IonRow } from '@ionic/react';

import SadCloud from '../../components/svgs/SadCloud';
import CloudWarning from '../../components/svgs/CloudWarning';
import ConsentFlowErrorFooter from './ConsentFlowErrorFooter';

import { useHistory } from 'react-router-dom';
import { useModal } from 'learn-card-base';

type ConsentFlowErrorProps = {
    errorType: number;
    uri?: string;
};

const ConsentFlowError: React.FC<ConsentFlowErrorProps> = ({ errorType, uri }) => {
    const history = useHistory();
    const { closeModal } = useModal();

    const handleRetry = () => {
        closeModal();
        setTimeout(() => {
            history.push(`/consent-flow?uri=${uri}`);
        }, 300);
    };

    const getErrorContent = () => {
        switch (errorType) {
            case 400:
            case 404:
                return {
                    Icon: SadCloud,
                    title: 'Nothing Found',
                    message: 'This Consent Flow does not or no longer exists.',
                    hideRetry: true,
                };
            case 500:
                return {
                    Icon: CloudWarning,
                    title: 'Network Error',
                    message: 'There was a problem loading this Consent Flow.',
                    hideRetry: false,
                };
            default:
                return null;
        }
    };

    const content = getErrorContent();
    if (!content) return null;

    const { Icon, title, message, hideRetry } = content;

    return (
        <div className="px-[20px] py-[40px] flex justify-center items-center flex-col rounded-[24px] bg-white mt-[216px] m-auto w-[400px]">
            <Icon />
            <h1 className="font-notoSans font-semibold text-[22px] text-grayscale-900 pb-[20px] pt-[15px]">
                {title}
            </h1>
            <p className="font-poppins font-normal text-[17px] text-grayscale-900 text-center leading-[130%] tracking-[-0.25px] w-[295px]">
                {message}
            </p>
            <IonFooter
                mode="ios"
                className="flex justify-center items-center ion-no-border absolute bottom-0"
            >
                <IonRow className="relative z-10 w-full flex justify-center items-center gap-8">
                    <ConsentFlowErrorFooter hideRetry={hideRetry} buttonAction={handleRetry} />
                </IonRow>
            </IonFooter>
        </div>
    );
};

export default ConsentFlowError;
