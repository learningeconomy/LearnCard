import React from 'react';
import Lottie from 'react-lottie-player';

import { IonCol, IonSpinner } from '@ionic/react';
import BoostErrorsDisplay from '../../../components/boost/boostErrors/BoostErrorsDisplay';
import HourGlass from '../../../assets/lotties/hourglass.json';
import BoostEarnedIDCard from './BoostEarnedIDCard';

import {
    CredentialCategoryEnum,
    BoostPageViewMode,
    BoostPageViewModeType,
    useGetIDs,
} from 'learn-card-base';

import { useLoadingLine } from '../../../stores/loadingStore';

type BoostEarnedIDListProps = {
    category: CredentialCategoryEnum;
    viewMode: BoostPageViewModeType;
    bgFillerColor?: string;
    defaultImg: string;
    title?: string;
    emptyMessage?: string;
    emptyMessageStyle?: string;
};

const BoostEarnedIDListAlternative: React.FC<BoostEarnedIDListProps> = ({
    category,
    viewMode,
    defaultImg,
    emptyMessage,
    emptyMessageStyle,
}) => {
    const {
        data: records,
        isLoading: credentialsLoading,
        isFetching: credentialsFetching,
        refetch: earnedBoostsRefetch,
        error: earnedBoostsError,
    } = useGetIDs();

    const credentialsBackgroundFetching = credentialsFetching && !credentialsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    const boostError = earnedBoostsError ? true : false;

    const credentials =
        records?.map((record, index) => {
            return (
                <BoostEarnedIDCard
                    key={record?.id || index}
                    uri={record?.uri}
                    credential={record}
                    defaultImg={defaultImg}
                    categoryType={category}
                    boostPageViewMode={viewMode}
                    loading={credentialsLoading}
                />
            );
        }) ?? [];

    const handleRefetch = async () => {
        try {
            await earnedBoostsRefetch?.();
        } catch (e) {
            throw new Error('There was an error, please try again.');
        }
    };

    const isCardView = viewMode === BoostPageViewMode.Card;

    return (
        <>
            {credentialsLoading && !earnedBoostsError && (
                <section className="loading-spinner-container flex items-center justify-center h-[80%] w-full ">
                    <div className="max-w-[280px] mt-[-40px]">
                        <Lottie
                            loop
                            animationData={HourGlass}
                            play
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </section>
            )}
            {!credentialsLoading && !earnedBoostsError && records && credentials.length > 0 && (
                <>
                    {isCardView && (
                        <section className="relative flex flex-wrap gap-[10px] text-center justify-center items-center max-w-[800px]">
                            <div className="bg-filler bg-sp-green-forest-light absolute h-full mt-[200px] w-[3000px] z-[-10]" />
                            {credentials}
                            {credentialsFetching && (
                                <div className="w-full flex items-center justify-center">
                                    <IonSpinner
                                        name="crescent"
                                        color="grayscale-900"
                                        className="scale-[2] mb-8 mt-6"
                                    />
                                </div>
                            )}
                        </section>
                    )}
                    {!isCardView && (
                        <IonCol className="flex m-auto items-center flex-wrap w-full achievements-list-container">
                            <div className="bg-filler bg-sp-green-forest-light absolute h-full mt-[200px] w-[3000px] z-[-10]" />
                            <div className="flex flex-col gap-[10px] w-full max-w-[700px] px-[20px]">
                                {credentials}
                            </div>
                            {credentialsFetching && (
                                <div className="w-full flex items-center justify-center">
                                    <IonSpinner
                                        name="crescent"
                                        color="grayscale-900"
                                        className="scale-[2] mb-8 mt-6"
                                    />
                                </div>
                            )}
                        </IonCol>
                    )}
                </>
            )}
            {!credentialsLoading &&
                !earnedBoostsError &&
                credentials &&
                credentials?.length === 0 && (
                    <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center mt-[20px]">
                        <img src={defaultImg} alt="ids" className="w-[200px] h-[200px] m-auto" />
                        <p
                            className={`absolute inset-0 flex items-center justify-center font-bold text-center w-[133px] m-auto text-[16px] ${emptyMessageStyle}`}
                        >
                            {emptyMessage}
                        </p>
                    </section>
                )}
            {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
        </>
    );
};

export default BoostEarnedIDListAlternative;
