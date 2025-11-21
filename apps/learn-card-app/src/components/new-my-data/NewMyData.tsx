import React from 'react';
import queryString from 'query-string';
import { useLocation } from 'react-router-dom';

import { IonSpinner } from '@ionic/react';
import ConsentFlowSyncButton from '../../pages/consentFlow/ConsentFlowSyncButton';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';

import { ProfilePicture } from 'learn-card-base';
import { oauth2ReducerArgStore } from '../../pages/sync-my-school/ExternalAuthServiceProvider';
import { useRegistryState } from '../../hooks/useRegistryEntryState';

const NewMyData: React.FC = () => {
    const location = useLocation();
    const currentUser = useCurrentUser();
    const entries = useRegistryState();

    const entriesLoading = entries?.some(entry => entry.isFetching);

    return (
        <section className="w-full flex flex-col gap-[20px] items-center px-[20px] py-[30px] bg-white rounded-[24px]">
            <header className="flex items-center flex-col gap-[10px] border-solid border-b-[1px] border-grayscale-200 pb-[20px] w-full">
                <span className="text-grayscale-900 uppercase text-[14px] font-montserrat normal font-[700] tracking-[7px] text-center">
                    LearnCard
                </span>

                <div className="flex flex-col items-center">
                    <ProfilePicture customContainerClass="flex justify-center items-center h-[60px] w-[60px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl" />
                    <span className="text-grayscale-900 font-poppins text-xl font-medium leading-[130%]">
                        {currentUser?.name}
                    </span>
                </div>

                <span className="text-grayscale-700 text-[14px]">
                    Universal Learning & Work Portfolio
                </span>
            </header>

            <div className="flex flex-col gap-[10px] items-center">
                <span className="text-grayscale-900 text-[20px] font-poppins font-[600] leading-[160%]">
                    My Data Connections
                </span>
                <span className="text-grayscale-800 text-[17px] font-poppins text-center">
                    Connect Your Learning and Employment Data
                </span>
            </div>

            <div className="flex flex-col gap-[10px]">
                {!entriesLoading &&
                    (entries?.filter(entry => entry?.data?.state !== 'Hidden').length ?? 0) ===
                        0 && (
                        <span className="text-center">
                            You haven't connected to any data sources yet.
                        </span>
                    )}

                {entries?.map((entry, index) => {
                    return (
                        <ConsentFlowSyncButton
                            preLogin={() => {
                                oauth2ReducerArgStore.set.args({
                                    action: 'redirect',
                                    data: {
                                        path: location.pathname,
                                        params: queryString.stringify({
                                            ...queryString.parse(location.search),
                                            myNewDataOpen: true,
                                            dataSource: entry.data?.id,
                                        }),
                                    },
                                });
                            }}
                            entry={entry.data}
                            key={entry.data?.id ?? index}
                        />
                    );
                })}

                {entriesLoading && <IonSpinner />}
            </div>
        </section>
    );
};

export default NewMyData;
