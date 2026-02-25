import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';

import BoostEarnedCard from '../../../boost/boost-earned-card/BoostEarnedCard';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import SlimCaretRight from '../../../svgs/SlimCaretRight';
import SlimCaretLeft from '../../../svgs/SlimCaretLeft';
import { IonIcon } from '@ionic/react';

import { useGetCredentialList } from 'learn-card-base';
import { ResumeSectionKey } from '../../resume-builder.helpers';
import { resumeBuilderStore } from '../../../../stores/resumeBuilderStore';

import 'swiper/css';

export const ResumeConfigCredentialSelector: React.FC<{
    sectionKey: ResumeSectionKey;
    label: string;
}> = ({ sectionKey, label }) => {
    const swiperRef = useRef<any>(null);

    const [open, setOpen] = useState<boolean>(false);

    const [atBeginning, setAtBeginning] = useState<boolean>(true);
    const [atEnd, setAtEnd] = useState<boolean>(false);

    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();
    const toggleCredential = resumeBuilderStore.set.toggleCredential;
    const selected = (credentialEntries[sectionKey] ?? []).map(e => e.uri);

    const { data: credentialPages, isLoading } = useGetCredentialList(sectionKey as any);

    const records = credentialPages?.pages?.flatMap(page => page?.records ?? []) ?? [];
    const totalCount = records.length;
    const selectedCount = selected.length;
    const showNavigation = totalCount > 1;

    const handleSwiperUpdate = (swiper: any) => {
        setAtBeginning(swiper.isBeginning);
        setAtEnd(swiper.isEnd);
    };

    return (
        <div className="border-b border-grayscale-100">
            <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpen(o => !o)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-grayscale-800">{label}</span>
                    {selectedCount > 0 && (
                        <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5">
                            {selectedCount}
                        </span>
                    )}
                </div>
                <IonIcon
                    color="grayscale-800"
                    icon={open ? chevronDownOutline : chevronUpOutline}
                />
            </button>
            {open && (
                <div className="pb-4 pl-4">
                    {isLoading && (
                        <p className="text-xs text-grayscale-400 px-4 mb-2">Loading credentials…</p>
                    )}
                    {!isLoading && totalCount === 0 && (
                        <p className="text-xs text-grayscale-400 px-4 mb-2">
                            No credentials in this category.
                        </p>
                    )}
                    {!isLoading && totalCount > 0 && (
                        <div className="relative">
                            <Swiper
                                onSwiper={swiper => {
                                    swiperRef.current = swiper;
                                    handleSwiperUpdate(swiper);
                                }}
                                onSlideChange={handleSwiperUpdate}
                                onReachBeginning={() => setAtBeginning(true)}
                                onFromEdge={() => {
                                    if (swiperRef.current) {
                                        setAtBeginning(swiperRef.current.isBeginning);
                                        setAtEnd(swiperRef.current.isEnd);
                                    }
                                }}
                                onReachEnd={() => setAtEnd(true)}
                                spaceBetween={12}
                                slidesPerView={'auto'}
                                grabCursor={true}
                                preventClicks={false}
                                preventClicksPropagation={false}
                            >
                                {records.map((record, index) => {
                                    const isSelected = selected.includes(record.uri);
                                    const boostCategory = record.category as any;

                                    return (
                                        <SwiperSlide
                                            key={record.uri ?? index}
                                            style={{ width: 'auto' }}
                                            className={`cursor-pointer transition-opacity`}
                                        >
                                            <BoostEarnedCard
                                                record={record}
                                                categoryType={boostCategory}
                                                sizeLg={12}
                                                sizeMd={12}
                                                sizeSm={12}
                                                showChecked
                                                initialCheckmarkState={isSelected}
                                                onCheckMarkClick={() =>
                                                    toggleCredential(sectionKey, record.uri)
                                                }
                                                isInSkillsModal
                                                className="!min-h-[310px]"
                                            />
                                        </SwiperSlide>
                                    );
                                })}
                            </Swiper>

                            {showNavigation && !atBeginning && (
                                <button
                                    onClick={() => swiperRef.current?.slidePrev()}
                                    className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-50 shadow-md hover:bg-gray-200 transition-all duration-200"
                                    style={{ opacity: 0.8 }}
                                >
                                    <SlimCaretLeft className="w-5 h-auto" />
                                </button>
                            )}

                            {showNavigation && !atEnd && (
                                <button
                                    onClick={() => swiperRef.current?.slideNext()}
                                    className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-50 shadow-md hover:bg-gray-200 transition-all duration-200"
                                    style={{ opacity: 0.8 }}
                                >
                                    <SlimCaretRight className="w-5 h-auto" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResumeConfigCredentialSelector;
