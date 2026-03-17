import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';

import BoostEarnedCard from '../../../boost/boost-earned-card/BoostEarnedCard';
import { chevronDownOutline, chevronUpOutline, searchOutline } from 'ionicons/icons';
import SlimCaretRight from '../../../svgs/SlimCaretRight';
import SlimCaretLeft from '../../../svgs/SlimCaretLeft';
import { IonIcon } from '@ionic/react';

import { useGetCredentials } from 'learn-card-base';
import { ResumeSectionKey } from '../../resume-builder.helpers';
import { resumeBuilderStore } from '../../../../stores/resumeBuilderStore';
import ResumeBuilderToggle from '../../ResumeBuilderToggle';

import 'swiper/css';

export const ResumeConfigCredentialSelector: React.FC<{
    sectionKey: ResumeSectionKey;
    label: string;
}> = ({ sectionKey, label }) => {
    const swiperRef = useRef<any>(null);

    const [open, setOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [atBeginning, setAtBeginning] = useState<boolean>(true);
    const [atEnd, setAtEnd] = useState<boolean>(false);

    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();
    const hiddenSections = resumeBuilderStore.useTracked.hiddenSections();
    const toggleCredential = resumeBuilderStore.set.toggleCredential;
    const setSectionHidden = resumeBuilderStore.set.setSectionHidden;
    const selected = (credentialEntries[sectionKey] ?? []).map(e => e.uri);
    const isSectionVisible = !hiddenSections?.[sectionKey];

    const { data: credentialResults, isLoading } = useGetCredentials(
        sectionKey as any,
        undefined,
        true
    );

    const records = (credentialResults as Array<{ vc: any; uri?: string }> | undefined) ?? [];
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const filteredRecords = records.filter(record => {
        if (!normalizedSearchQuery) return true;

        const credentialSubject = record?.vc?.credentialSubject as Record<string, any> | undefined;
        const boost = record?.vc?.boostCredential;

        const searchableText = [
            boost?.name,
            record?.vc?.name,
            credentialSubject?.name,
            credentialSubject?.title,
            credentialSubject?.achievement?.name,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return searchableText.includes(normalizedSearchQuery);
    });
    const selectedCount = selected.length;
    const statusLabel = isSectionVisible ? 'On' : 'Off';
    const handleSwiperUpdate = (swiper: any) => {
        setAtBeginning(swiper.isBeginning);
        setAtEnd(swiper.isEnd);
    };

    return (
        <div className="bg-white border border-grayscale-200 rounded-2xl border-b overflow-hidden">
            <button
                className="w-full flex items-center justify-between px-4 py-4 text-left border-b border-solid border-[1px] border-grayscale-200"
                onClick={() => setOpen(!open)}
            >
                <div className="flex flex-col items-center">
                    <div className="flex items-start justify-start gap-2">
                        <div onClick={e => e.stopPropagation()} className="shrink-0">
                            <ResumeBuilderToggle
                                checked={isSectionVisible}
                                onChange={checked => setSectionHidden(sectionKey, !checked)}
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            <span className="block text-[18px] leading-none font-medium text-grayscale-900">
                                {label}
                            </span>
                            <span className="block text-xs font-semibold text-grayscale-600">
                                {selectedCount} Selected • {statusLabel}
                            </span>
                        </div>
                    </div>
                </div>
                <IonIcon
                    color="grayscale-800"
                    icon={open ? chevronDownOutline : chevronUpOutline}
                    className="shrink-0 text-grayscale-500"
                />
            </button>
            {open && (
                <div className="pb-4">
                    <div className="px-4 pt-4">
                        <div className="flex items-center gap-3 rounded-2xl bg-grayscale-100 px-4 py-3">
                            <IonIcon
                                icon={searchOutline}
                                className="h-5 w-5 shrink-0 text-grayscale-500"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={label}
                                className="w-full bg-transparent text-sm text-grayscale-800 placeholder:text-grayscale-500 outline-none"
                            />
                        </div>
                    </div>
                    {isLoading && (
                        <p className="text-xs text-grayscale-400 px-4 mt-4 mb-2">
                            Loading credentials...
                        </p>
                    )}
                    {!isLoading && records.length === 0 && (
                        <p className="text-xs text-grayscale-400 px-4 mt-4 mb-2">
                            No credentials in this category.
                        </p>
                    )}
                    {!isLoading && records.length > 0 && filteredRecords.length === 0 && (
                        <p className="text-xs text-grayscale-400 px-4 mt-4 mb-2">
                            No credentials match "{searchQuery.trim()}".
                        </p>
                    )}
                    {!isLoading && filteredRecords.length > 0 && (
                        <div className="relative px-4 pt-4">
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
                                style={{ overflow: 'visible' }}
                            >
                                {filteredRecords.map((record, index) => {
                                    const isSelected = selected.includes(record.uri);
                                    const boostCategory = sectionKey as any;

                                    return (
                                        <SwiperSlide
                                            key={record.uri ?? index}
                                            style={{ width: 'auto' }}
                                            className={`cursor-pointer transition-opacity`}
                                        >
                                            <BoostEarnedCard
                                                credential={record.vc}
                                                record={{ uri: record.uri }}
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
                                                hideOptionsMenu
                                                className="!min-h-[310px]"
                                            />
                                        </SwiperSlide>
                                    );
                                })}
                            </Swiper>

                            {!atBeginning && (
                                <button
                                    onClick={() => swiperRef.current?.slidePrev()}
                                    aria-label="Previous credential"
                                    className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-[1101] shadow-md hover:bg-gray-200 transition-all duration-200"
                                    style={{ opacity: 0.85 }}
                                >
                                    <SlimCaretLeft className="w-5 h-auto" />
                                </button>
                            )}

                            {(!atBeginning || filteredRecords.length > 2) && (
                                <button
                                    onClick={() => swiperRef.current?.slideNext()}
                                    aria-label="Next credential"
                                    className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-[1101] shadow-md hover:bg-gray-200 transition-all duration-200"
                                    style={{ opacity: atEnd ? 0.35 : 0.85 }}
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
