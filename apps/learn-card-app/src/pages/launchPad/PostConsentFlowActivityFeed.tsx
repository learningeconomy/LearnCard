import React, { useEffect, useRef } from 'react';
import { ConsentFlowTerms, ConsentFlowContractDetails, LCNProfile } from '@learncard/types';
import moment from 'moment';

import {
    IonCol,
    IonDatetime,
    IonGrid,
    IonHeader,
    IonRow,
    IonSkeletonText,
    IonSpinner,
    IonToolbar,
} from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import { useModal, useTermsTransactions } from 'learn-card-base';
import TransactionHistoryItem from '../consentFlow/TransactionHistoryItem';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';

const defaultDate = moment().add(6, 'months').toISOString(); // sets the shareable expiration date 6 months from today

type PostConsentFlowActivityFeedProps = {
    shareDuration: {
        oneTimeShare: boolean;
        customDuration: string;
    };
    setShareDuration: React.Dispatch<
        React.SetStateAction<{
            oneTimeShare: boolean;
            customDuration: string;
        }>
    >;
    consentedContract?: {
        expiresAt?: string;
        liveSyncing?: boolean;
        oneTime?: boolean;
        terms: ConsentFlowTerms;
        contract: ConsentFlowContractDetails;
        uri: string;
        consenter: LCNProfile;
    };
};

const PostConsentFlowActivityFeed: React.FC<PostConsentFlowActivityFeedProps> = ({
    shareDuration,
    setShareDuration,
    consentedContract,
}) => {
    const { closeModal } = useModal();
    const infiniteScrollRef = useRef<HTMLDivElement>(null);

    const {
        data: transactionsData,
        hasNextPage,
        fetchNextPage,
        isFetching,
        isPending,
    } = useTermsTransactions(consentedContract?.uri);

    const onScreen = useOnScreen(infiniteScrollRef as any, '300px', [
        transactionsData?.pages?.[0]?.records?.length,
    ]);

    useEffect(() => {
        if (onScreen && hasNextPage) fetchNextPage();
    }, [fetchNextPage, hasNextPage, onScreen]);

    const handleStateChange = <Key extends keyof typeof shareDuration>(
        propName: Key,
        value: (typeof shareDuration)[Key]
    ) => {
        setShareDuration(prevState => {
            return {
                ...prevState,
                [propName]: value,
            };
        });
    };

    // const [presentDatePicker] = useIonModal(
    //     <div className="w-full h-full transparent flex items-center justify-center">
    //         <IonDatetime
    //             onIonChange={e => {
    //                 handleStateChange('customDuration', moment(e.detail.value).toISOString());
    //                 handleStateChange('oneTimeShare', false);
    //             }}
    //             value={
    //                 shareDuration?.customDuration
    //                     ? moment(shareDuration?.customDuration).format('YYYY-MM-DD')
    //                     : null
    //             }
    //             id="datetime"
    //             presentation="date"
    //             className="bg-white text-black rounded-[20px] shadow-3xl z-50"
    //             showDefaultButtons
    //             color="indigo-500"
    //             max="2050-12-31"
    //             min={moment().format('YYYY-MM-DD')}
    //         />
    //     </div>
    // );

    const transactions = isPending
        ? Array(10)
            .fill(0)
            .map((_, index) => (
                <li
                    key={index}
                    className="w-full py-4 [&:not(:last-of-type)]:border-b flex flex-col gap-2"
                >
                    <header className="flex gap-1 text-sm font-poppins">
                        <IonSkeletonText animated className="w-64" />
                    </header>
                    <section className="text-xs font-poppins text-grayscale-700">
                        <IonSkeletonText animated />
                    </section>
                </li>
            ))
        : transactionsData?.pages.flatMap(page =>
            page?.records.map(transaction => (
                <TransactionHistoryItem
                    key={transaction.id}
                    transaction={transaction}
                    contractOwner={consentedContract?.contract.owner}
                />
            ))
        );

    return (
        <section className="bg-white min-h-full w-full pt-[15px]">
            <IonHeader className="ion-no-border">
                <IonToolbar className="ion-no-border" color="white">
                    <IonGrid>
                        <IonRow className="w-full flex flex-col items-center justify-center">
                            <IonRow className="w-full max-w-[600px] flex items-center justify-between">
                                <IonCol className="flex flex-1 justify-start items-center">
                                    <button
                                        className="text-white p-0 mr-[10px]"
                                        aria-label="Back button"
                                        onClick={closeModal}
                                    >
                                        <CaretLeft className="h-auto w-3 text-grayscale-900" />
                                    </button>
                                    <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl font-medium">
                                        Activity Feed
                                    </h3>
                                </IonCol>
                            </IonRow>
                        </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonHeader>
            <IonGrid className="flex items-center justify-center flex-col w-full max-w-[600px] px-4 pb-14">
                <IonRow className="w-full">
                    <ol className="px-1 pt-4 w-full flex flex-col items-center">
                        {transactions}
                        <div role="presentation" ref={infiniteScrollRef} />
                        {isFetching && <IonSpinner className="mt-8" name="lines" />}
                    </ol>
                </IonRow>
            </IonGrid>
        </section>
    );
};

export default PostConsentFlowActivityFeed;
