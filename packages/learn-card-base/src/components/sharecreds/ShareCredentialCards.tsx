import React from 'react';
import queryString from 'query-string';
import { useLocation } from 'react-router-dom';
import useShareCredentials, { VcType, VC_TYPE } from 'learn-card-base/hooks/useShareCredentials';

import GenericCardWrapper from 'learn-card-base/components/GenericCardWrapper/GenericCardWrapper';
import { IonToggle } from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper';
import { VC } from '@learncard/types';

type ShareCredentialCardsProps = { preSelectedCredentials?: VC[]; viewOnly?: boolean };

const ShareCredentialCards: React.FC<ShareCredentialCardsProps> = ({
    preSelectedCredentials = undefined,
    viewOnly = false,
}) => {
    const { search } = useLocation();
    let { skipReload } = queryString.parse(search);
    const skipReloadBool = skipReload === 'true';

    const {
        handleToggleSelectAllType,
        handleVcClick,
        loading: credentialsLoading,
        getUniqueId,
        vcCounts,
        getAllSelected,
        getVcsByType,
        isVcSelected,
    } = useShareCredentials(preSelectedCredentials, skipReloadBool);
    const showCredentials = !credentialsLoading;

    const vcDisplayWord: { [vcType in VcType]: string } = {
        [VC_TYPE.COURSE]: 'Course',
        [VC_TYPE.ID]: 'ID',
        [VC_TYPE.ACHIEVEMENT]: 'Achievement',
        [VC_TYPE.SKILL]: 'Skill',
        [VC_TYPE.WORK]: 'Work History',
        [VC_TYPE.SOCIAL_BADGE]: 'Social Badge',
    };
    const vcColor: { [vcType in VcType]: string } = {
        [VC_TYPE.COURSE]: 'emerald-600',
        [VC_TYPE.ID]: 'yellow-400',
        [VC_TYPE.ACHIEVEMENT]: 'spice-600',
        [VC_TYPE.SKILL]: 'indigo-400',
        [VC_TYPE.WORK]: 'rose-600',
        [VC_TYPE.SOCIAL_BADGE]: 'cyan-300',
    };

    const getTitle = (type: VcType) => {
        return `${vcCounts[type].selectedCount} ${vcDisplayWord[type]}${
            vcCounts[type].selectedCount !== 1 && type !== VC_TYPE.WORK ? 's' : ''
        }`;
    };

    if (!showCredentials) return null;
    return (
        <>
            {Object.values(VC_TYPE).map((vcType, index) => {
                const count = viewOnly
                    ? vcCounts[vcType].selectedCount
                    : vcCounts[vcType].totalCount;
                return (
                    <React.Fragment key={index}>
                        {count > 0 && (
                            <section key={vcType} data-testid={`${vcType}-section`}>
                                <div className="flex justify-between items-center mx-[20px] mt-[20px]">
                                    <h2 className="text-[20px] font-bold text-gray-900">
                                        {getTitle(vcType)}
                                    </h2>

                                    {!viewOnly && (
                                        <span className="flex justify-center items-center font-medium">
                                            All
                                            <IonToggle
                                                onClick={() => handleToggleSelectAllType(vcType)}
                                                slot="end"
                                                className="ml-[10px]"
                                                checked={getAllSelected(vcType)}
                                                aria-label={`${vcType} toggle`}
                                            />
                                        </span>
                                    )}
                                </div>
                                <Swiper
                                    slidesPerView="auto"
                                    modules={[Navigation]}
                                    navigation
                                    spaceBetween={10}
                                    className="card-slider"
                                >
                                    {getVcsByType(vcType)?.map(vc => {
                                        if (viewOnly && !isVcSelected(vc)) return undefined;

                                        const uniqueId = getUniqueId(vc);
                                        return (
                                            <SwiperSlide key={uniqueId}>
                                                <GenericCardWrapper
                                                    vc={vc}
                                                    customHeaderClass={`bg-${vcColor[vcType]}`}
                                                    onClick={
                                                        viewOnly
                                                            ? undefined
                                                            : () => handleVcClick(uniqueId, vcType)
                                                    }
                                                    selectAll={getAllSelected(vcType)}
                                                    initialCheckmarkState={isVcSelected(vc)}
                                                    showChecked={!viewOnly}
                                                />
                                            </SwiperSlide>
                                        );
                                    })}
                                </Swiper>
                            </section>
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default ShareCredentialCards;
