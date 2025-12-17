import React from 'react';

import { IonFooter, IonPage, IonToolbar } from '@ionic/react';
import ScoutPassIDCMSLayout from './ScoutPassIDCMSLayout';
import IDSleeve from 'learn-card-base/svgs/IDSleeve';
import ScoutPassID from './ScoutPassID';
import { userAccount, UserCMSAppearance } from './scouts-cms.helpers';

export const ScoutPassIDPreview: React.FC<{
    user: userAccount;
    scoutPassID: UserCMSAppearance;
    handleCloseModal: () => void;
}> = ({ user, scoutPassID, handleCloseModal }) => {
    return (
        <IonPage>
            <ScoutPassIDCMSLayout
                scoutPassID={scoutPassID}
                containerClassName="!justify-center"
                layoutClassName="!max-w-[375px]"
            >
                <div className="rounded-t-[20px] shadow-box-bottom flex flex-col">
                    <div className="w-full flex items-center justify-center flex-col bg-white bg-opacity-70 backdrop-blur-[10px] rounded-t-[20px]">
                        <div className="w-full py-4 max-w-[335px]">
                            <ScoutPassID user={user} scoutPassID={scoutPassID} />
                        </div>

                        <div className="w-full flex items-center justify-center relative mb-[-2.5px]">
                            <IDSleeve className="h-auto w-full" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-b-[20px] shadow-soft-bottom">
                    <div className="ion-padding">
                        <div className="w-full flex items-center justify-end pb-2" />
                    </div>
                </div>
            </ScoutPassIDCMSLayout>
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] absolute bottom-0 bg-white max-h-[100px]"
            >
                <IonToolbar color="transparent" mode="ios">
                    <div className="w-full flex items-center justify-center">
                        <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                            <button
                                onClick={handleCloseModal}
                                className={`text-grayscale-900 bg-grayscale-100 text-lg font-bold rounded-full py-[12px] w-full`}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default ScoutPassIDPreview;
