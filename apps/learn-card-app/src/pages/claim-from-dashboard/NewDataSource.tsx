import React, { useEffect } from 'react';
import queryString from 'query-string';
import { useLocation } from 'react-router-dom';

import { IonPage, IonLoading } from '@ionic/react';
import ConsentFlowSyncButton from '../../pages/consentFlow/ConsentFlowSyncButton';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';

import { ProfilePicture, useToast, ToastTypeEnum } from 'learn-card-base';
import { oauth2ReducerArgStore } from '../../pages/sync-my-school/ExternalAuthServiceProvider';
import useRegistry from 'learn-card-base/hooks/useRegistry';
import { useRegistryEntryState } from '../../hooks/useRegistryEntryState';

import useTheme from '../../theme/hooks/useTheme';

export type NewDataSourceProps = {
    handleCloseModal: () => void;
    entryId: string;
};

const NewDataSource: React.FC<NewDataSourceProps> = ({ handleCloseModal, entryId }) => {
    const location = useLocation();
    const currentUser = useCurrentUser();
    const { data: registry } = useRegistry();

    const newEntry = registry?.find(source => source.membershipId === entryId);

    const { data: state } = useRegistryEntryState(newEntry);

    const { presentToast } = useToast();

    useEffect(() => {
        if (state === 'Synced') {
            handleCloseModal();
            presentToast(`Successfully synced Data Source!`, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        }
    }, [state]);

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <IonPage className="p-[30px] pb-[20px] flex flex-col items-center justify-center gap-[10px]">
            <IonLoading isOpen={!newEntry} mode="ios" message="Fetching Data Source" />
            {Boolean(newEntry) && (
                <>
                    <section className="w-full flex flex-col gap-[20px] items-center px-[20px] py-[30px] bg-white shadow-bottom rounded-[24px] max-w-[350px]">
                        <header className="flex items-center flex-col gap-[10px] border-solid border-b-[1px] border-grayscale-200 pb-[20px] w-full">
                            <span className="text-grayscale-900 text-[14px] font-montserrat normal font-[700] tracking-[7px] text-center">
                                LearnCard
                            </span>

                            <div className="flex flex-col items-center">
                                <ProfilePicture customContainerClass="flex justify-center items-center h-[60px] w-[60px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl" />
                                <span className="text-grayscale-900 font-poppins text-[31px] leading-[130%]">
                                    {currentUser?.name}
                                </span>
                            </div>

                            <span className="text-grayscale-700 text-[14px]">
                                Universal Learning & Work Portfolio
                            </span>
                        </header>

                        <div className="flex flex-col gap-[10px] items-center">
                            <span className="text-grayscale-900 text-[20px] font-poppins font-[600] leading-[160%]">
                                New Data Source
                            </span>
                            <span className="text-grayscale-800 text-[17px] font-poppins text-center">
                                Claiming this membership has granted you access to sync a new data
                                source!
                            </span>
                        </div>

                        <div className="flex flex-col gap-[10px]">
                            <ConsentFlowSyncButton
                                preLogin={() => {
                                    oauth2ReducerArgStore.set.args({
                                        action: 'redirect',
                                        data: {
                                            path: location.pathname,
                                            params: queryString.stringify({
                                                ...queryString.parse(location.search),
                                                myNewDataOpen: true,
                                                dataSource: newEntry!.id,
                                            }),
                                        },
                                    });
                                }}
                                entry={newEntry!}
                            />
                        </div>
                        <div className="text-grayscale-900 text-[14px]">
                            Maybe later?{' '}
                            <button
                                type="button"
                                onClick={() => handleCloseModal()}
                                className={`text-${primaryColor} font-[600]`}
                            >
                                Skip
                            </button>
                        </div>
                    </section>
                </>
            )}
        </IonPage>
    );
};

export default NewDataSource;
