import React, { useState, useEffect, useRef } from 'react';

import { IonCol, IonGrid, IonHeader, IonRow, IonSpinner, IonToolbar } from '@ionic/react';
import { useXApiStatements } from 'learn-card-base';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { useWallet } from 'learn-card-base';
import DataFeedItem from '../consentFlow/DataFeedItem';
import Pulpo from '../../assets/lotties/cuteopulpo.json';
import Lottie from 'react-lottie-player';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';

type XAPIStatement = {
    actor: {
        objectType: string;
        name: string;
        account: {
            homePage: string;
            name: string;
        };
    };
    verb: {
        id: string;
        display: {
            'en-US': string;
        };
    };
    object: {
        id: string;
        definition: {
            name: { 'en-US': string };
            description: { 'en-US': string };
            type: string;
        };
    };
};

type XAPIStatementsResponse = {
    statements: XAPIStatement[];
    more: string;
};

const PostConsentFlowDataFeed = () => {
    const { data, fetchNextPage, hasNextPage, isFetching } = useXApiStatements();
    const infiniteScrollRef = useRef<HTMLDivElement>(null);
    const onScreen = useOnScreen(infiniteScrollRef as any, '300px', [
        data?.pages?.[0]?.statements?.length,
    ]);

    useEffect(() => {
        if (onScreen && hasNextPage) fetchNextPage();
    }, [fetchNextPage, hasNextPage, onScreen]);

    const statements = data?.pages.flatMap(page =>
        page?.statements.map((statement, index) => {
            return <DataFeedItem key={index} apiStatement={statement} />;
        })
    );

    return (
        <section className="bg-white h-full min-h-screen w-full pt-[15px]">
            <IonHeader className="ion-no-border">
                <IonToolbar className="ion-no-border" color="white">
                    <IonGrid>
                        <IonRow className="w-full flex flex-col items-center justify-center">
                            <IonRow className="w-full max-w-[600px] flex items-center justify-between">
                                <IonCol className="flex flex-1 justify-start items-center">
                                    <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl font-medium">
                                        Data Feed
                                    </h3>
                                </IonCol>
                            </IonRow>
                        </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonHeader>
            <IonGrid className="flex items-center justify-center flex-col w-full max-w-[600px] px-4 pb-14">
                <IonRow className="w-full">
                    <div className="w-full flex flex-col items-center">
                        {!isFetching && statements?.length === 0 && (
                            <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                                <div className="w-[280px] h-[280px] mt-[-40px]">
                                    <Lottie
                                        loop
                                        animationData={Pulpo}
                                        play
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </div>
                                <strong className="text-grayscale-900">No data yet</strong>
                            </section>
                        )}
                        {(!statements || statements?.length === 0) && isFetching && (
                            <IonSpinner className="mt-8" color="dark" name="lines" />
                        )}

                        <ul className="w-full">{statements}</ul>
                        <div role="presentation" ref={infiniteScrollRef} />
                    </div>
                </IonRow>
            </IonGrid>
        </section>
    );
};

export default PostConsentFlowDataFeed;
