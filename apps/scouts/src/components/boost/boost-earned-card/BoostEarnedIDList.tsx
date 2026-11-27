import React, { useEffect, useRef } from 'react';

import BoostErrorsDisplay from '../../../components/boost/boostErrors/BoostErrorsDisplay';
import { CredentialListSkeleton } from 'learn-card-base/components/loaders/CredentialListSkeleton';

import {
    CredentialCategoryEnum,
    useGetCredentialList,
    BoostPageViewMode,
    BoostPageViewModeType,
} from 'learn-card-base';

import { useLoadingLine } from '../../../stores/loadingStore';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import BoostEarnedIDCard from './BoostEarnedIDCard';
import { SignUpForWaitList } from '../../../pages/membership/MembershipPage';
import { AppSpinner } from 'learn-card-base/ui/feedback/AppSpinner';
import { AppCol } from 'learn-card-base/ui/layout';

type BoostEarnedIDListProps = {
    category: CredentialCategoryEnum;
    viewMode: BoostPageViewModeType;
    bgFillerColor?: string;
    defaultImg: string;
    title: string;
    emptyMessage?: string;
    emptyMessageStyle?: string;
};

const BoostEarnedIDList: React.FC<BoostEarnedIDListProps> = ({
    category,
    viewMode,
    bgFillerColor,
    defaultImg,
    title,
    emptyMessage,
    emptyMessageStyle,
}) => {
    /*
        * start **
        Earned boosts query + pagination 
    */
    const infiniteScrollRef = useRef<HTMLDivElement>(null);
    const {
        data: records,
        isLoading: credentialsLoading,
        isFetching: credentialsFetching,
        hasNextPage,
        fetchNextPage,
        refetch: earnedBoostsRefetch,
        error: earnedBoostsError,
    } = useGetCredentialList(category);

    const onScreen = useOnScreen(infiniteScrollRef, '-100px', [
        records?.pages?.[0]?.records?.length,
    ]);

    useEffect(() => {
        if (onScreen && hasNextPage) fetchNextPage();
    }, [fetchNextPage, hasNextPage, onScreen, infiniteScrollRef]);
    /*
        Earned boosts query + pagination 
        * end **
    */

    const credentialsBackgroundFetching = credentialsFetching && !credentialsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    const boostError = earnedBoostsError ? true : false;

    const credentials =
        records?.pages?.flatMap(page =>
            page?.records?.map((record, index) => {
                return (
                    <BoostEarnedIDCard
                        key={record?.uri || index}
                        uri={record?.uri}
                        defaultImg={defaultImg}
                        categoryType={category}
                        boostPageViewMode={viewMode}
                        loading={credentialsLoading}
                    />
                );
            })
        ) ?? [];

    const handleRefetch = async () => {
        try {
            await earnedBoostsRefetch?.();
        } catch (e) {
            throw new Error('There was an error, please try again.', { cause: e });
        }
    };

    const isCardView = viewMode === BoostPageViewMode.Card;

    return (
        <>
            {credentialsLoading && !earnedBoostsError && (
                <CredentialListSkeleton
                    viewMode={isCardView ? 'card' : 'list'}
                    cardSize="credential"
                />
            )}
            {!credentialsLoading && !earnedBoostsError && records && credentials.length > 0 && (
                <>
                    {isCardView && (
                        <section className="relative flex flex-wrap gap-[10px] text-center justify-center items-center max-w-[800px]">
                            <div className="bg-filler bg-sp-green-forest-light absolute h-full mt-[200px] w-[3000px] -z-10" />
                            {credentials}
                            <div role="presentation" ref={infiniteScrollRef} />
                            {credentialsFetching && (
                                <div className="w-full flex items-center justify-center">
                                    <AppSpinner
                                        name="crescent"
                                        color="grayscale-900"
                                        className="scale-[2] mb-8 mt-6"
                                    />
                                </div>
                            )}
                        </section>
                    )}
                    {!isCardView && (
                        <AppCol className="flex m-auto items-center flex-wrap w-full achievements-list-container">
                            <div className="bg-filler bg-sp-green-forest-light absolute h-full mt-[200px] w-[3000px] -z-10" />
                            <div className="flex flex-col gap-[10px] w-full max-w-[700px] px-[20px]">
                                {credentials}
                            </div>
                            <div role="presentation" ref={infiniteScrollRef} />
                            {credentialsFetching && (
                                <div className="w-full flex items-center justify-center">
                                    <AppSpinner
                                        name="crescent"
                                        color="grayscale-900"
                                        className="scale-[2] mb-8 mt-6"
                                    />
                                </div>
                            )}
                        </AppCol>
                    )}
                </>
            )}
            {!credentialsLoading &&
                !earnedBoostsError &&
                credentials &&
                credentials?.length === 0 && (
                    <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center mt-[20px]">
                        <img src={defaultImg} alt="" className="w-[200px] h-[200px] m-auto" />
                        <p
                            className={`absolute inset-0 flex items-center justify-center font-bold text-center w-[133px] m-auto text-[16px] ${emptyMessageStyle}`}
                        >
                            {emptyMessage}
                        </p>
                        {/* <h2 className="text-2xl font-medium text-grayscale-900">
                            Organize Into Troops{' '}
                        </h2>
                        <p className="font-medium mt-[20px]  text-grayscale-900">
                            Soon local troops will be able to self organize and issue official scout
                            badges.
                        </p>
                        <SignUpForWaitList /> */}
                    </section>
                )}
            {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
        </>
    );
};

export default BoostEarnedIDList;
