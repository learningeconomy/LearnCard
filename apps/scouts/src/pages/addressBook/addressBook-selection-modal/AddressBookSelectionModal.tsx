import React, { useState, useEffect } from 'react';

import { IonRow, IonCol, IonInput, IonSpinner } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import AllContactsIcon from 'apps/scouts/src/components/svgs/AllContactsIcon';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import { useModal, useWallet, useGetConnections } from 'learn-card-base';
import TroopButton from './TroopButton';
import { VC } from '@learncard/types';

type AddressBookSelectionModalProps = {
    onGroupSelect: (groupId: string, boostId?: string) => void;
    selectedGroupId: string;
    setTroopCounts: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
    records: VC[];
    isLoadingRecords: boolean;
};

const AddressBookSelectionModal: React.FC<AddressBookSelectionModalProps> = ({
    onGroupSelect,
    selectedGroupId,
    setTroopCounts,
    records,
    isLoadingRecords,
}) => {
    const { closeModal } = useModal();
    const [search, setSearch] = useState<string>('');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const { initWallet } = useWallet();

    const [troopCountsInModal, setTroopCountsInModal] = useState<Record<string, number>>({});
    const [loadingCounts, setLoadingCounts] = useState(false);

    const getTroopCount = async (uri: string) => {
        const wallet = await initWallet();
        const troopCount = await wallet.invoke.countBoostRecipientsWithChildren(uri);
        return troopCount;
    };

    useEffect(() => {
        if (!records?.length) return;

        let cancelled = false;

        const fetchAllCounts = async () => {
            setLoadingCounts(true);

            try {
                const wallet = await initWallet();

                const parentDataArray = await Promise.all(
                    records.map(record => wallet.invoke.getBoostParents(record.boostId, 2))
                );

                // For each record, figure out which URI we should use to look up troop counts.
                const uris = parentDataArray.map((parentData, i) => {
                    const troopParent = parentData.records?.find(
                        (p: any) => p.type === 'ext:TroopID'
                    );
                    return troopParent?.uri ?? records[i].boostId;
                });

                // Fetch all troop counts at once
                const counts = await Promise.all(uris.map(uri => getTroopCount(uri)));

                const countsMap: Record<string, number> = {};
                counts.forEach((count, i) => {
                    countsMap[records[i].uri] = Math.max(count - 1, 0);
                });

                // Only update state if the effect hasn't been cancelled during async calls
                if (!cancelled) {
                    setTroopCountsInModal(countsMap);
                    setTroopCounts(countsMap);
                }
            } catch (err) {
                console.error('Failed to fetch troop counts', err);
            } finally {
                if (!cancelled) setLoadingCounts(false);
            }
        };

        fetchAllCounts();

        return () => {
            cancelled = true;
        };
    }, [records]);

    useEffect(() => {
        if (selectedGroupId) {
            setSelectedGroup(selectedGroupId ?? 'all');
        }
    }, [selectedGroupId]);

    const { data } = useGetConnections();

    const handleSelectingContactGroup = (group: string, boostId?: string) => {
        setSelectedGroup(group);
        onGroupSelect(group, boostId);
    };

    const filteredRecords = records?.filter(record =>
        record?.boostCredential?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const troopButtons = filteredRecords?.map((record, index) => {
        return (
            <TroopButton
                key={index}
                record={record}
                handleSelectingContactGroup={handleSelectingContactGroup}
                selectedGroup={selectedGroup}
                troopCountsInModal={troopCountsInModal}
            />
        );
    });

    return (
        <>
            <IonRow class="w-full max-w-[600px] px-3 py-[20px]">
                <IonCol className="flex w-full items-center justify-start">
                    <div className="cursor-pointer text-grayscale-900" onClick={closeModal}>
                        <CaretLeft />
                    </div>
                    <h1 className="text-[22px] font-notoSans font-normal text-grayscale-900 ml-[15px]">
                        Select from Contacts
                    </h1>
                </IonCol>
            </IonRow>
            <div className="bg-grayscale-100 flex flex-col items-center pb-[30px] pt-[10px] px-[20px]">
                <IonRow className="w-full max-w-[600px] bg-grayscale-100 rounded-[20px] mt-[10px]">
                    <IonCol className="flex w-full items-center justify-start">
                        <IonInput
                            autocapitalize="on"
                            placeholder="Search..."
                            value={search}
                            className="bg-white text-grayscale-800 ion-padding rounded-[15px] text-base font-medium tracking-wider subpixel-antialiased font-notoSans"
                            onIonInput={e => setSearch(e?.detail?.value as string)}
                            debounce={500}
                            type="text"
                            clearInput
                        />
                    </IonCol>
                </IonRow>
                {selectedGroup?.toLowerCase().includes(search.toLowerCase()) && (
                    <button
                        onClick={() => handleSelectingContactGroup('all')}
                        className="relative flex bg-white border-solid border-grayscale-200 border-[1px] rounded-[30px] p-[5px] pt-[10px] pl-[10px] w-full max-w-[550px] mt-[15px]"
                    >
                        <AllContactsIcon />
                        <div className="flex flex-col items-start ml-2">
                            <span className="text-sp-purple-base text-[12px] font-bold font-notoSans">
                                All Contacts
                            </span>
                            <span className="text-grayscale-800 text-[17px] font-normal font-notoSans">
                                {data?.length} Contacts
                            </span>
                        </div>
                        {selectedGroup === 'all' && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2  flex items-center justify-center text-white rounded-full bg-emerald-700 shadow-3xl w-8 h-8 disabled:bg-grayscale-400">
                                <Checkmark className="w-7 h-auto" />
                            </div>
                        )}
                    </button>
                )}
                {isLoadingRecords || loadingCounts ? (
                    <span className="flex items-center justify-center text-grayscale-600 font-poppins text-sm">
                        <IonSpinner
                            name="crescent"
                            color="dark"
                            className="scale-[1.5] mb-8 mt-6"
                        />
                    </span>
                ) : (
                    troopButtons
                )}
            </div>
        </>
    );
};
export default AddressBookSelectionModal;
