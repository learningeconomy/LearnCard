import React, { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';

import BoostEarnedCard from '../../../boost/boost-earned-card/BoostEarnedCard';
import { chevronDownOutline, chevronUpOutline, searchOutline } from 'ionicons/icons';
import SlimCaretRight from '../../../svgs/SlimCaretRight';
import SlimCaretLeft from '../../../svgs/SlimCaretLeft';
import { IonIcon } from '@ionic/react';
import type { CredentialCategory } from 'learn-card-base/types/credentials';

import { useGetCredentialList } from 'learn-card-base';
import {
    getResumeCredentialRecordsForSection,
    ResumeSectionKey,
    toResumeCredentialRecords,
} from '../../resume-builder.helpers';
import { resumeBuilderStore } from '../../../../stores/resumeBuilderStore';
import ResumeBuilderToggle from '../../ResumeBuilderToggle';

import 'swiper/css';

export const ResumeConfigCredentialSelector: React.FC<{
    sectionKey: ResumeSectionKey;
    label: string;
    focusSectionKey?: ResumeSectionKey;
    focusRequestId?: number;
}> = ({ sectionKey, label, focusSectionKey, focusRequestId }) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const swiperRef = useRef<SwiperInstance | null>(null);
    const hasScrolledAfterLoadRef = useRef<boolean>(false);

    const [open, setOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isFocusAnimating, setIsFocusAnimating] = useState<boolean>(false);

    const [atBeginning, setAtBeginning] = useState<boolean>(true);
    const [atEnd, setAtEnd] = useState<boolean>(false);

    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();
    const hiddenSections = resumeBuilderStore.useTracked.hiddenSections();
    const toggleCredential = resumeBuilderStore.set.toggleCredential;
    const setSectionHidden = resumeBuilderStore.set.setSectionHidden;
    const selected = (credentialEntries[sectionKey] ?? []).map(e => e.uri);
    const isSectionVisible = !hiddenSections?.[sectionKey];

    const {
        data: credentialResults,
        isLoading: isLoadingExactCredentials,
        isFetching: isFetchingExactCredentials,
        hasNextPage: hasNextExactCredentialsPage,
        fetchNextPage: fetchNextExactCredentialsPage,
        isFetchingNextPage: isFetchingNextExactCredentialsPage,
    } = useGetCredentialList(sectionKey as CredentialCategory);
    const {
        data: allCredentialResults,
        isLoading: isLoadingAllCredentials,
        isFetching: isFetchingAllCredentials,
        hasNextPage: hasNextAllCredentialsPage,
        fetchNextPage: fetchNextAllCredentialsPage,
        isFetchingNextPage: isFetchingNextAllCredentialsPage,
    } = useGetCredentialList();

    const records = getResumeCredentialRecordsForSection(
        sectionKey,
        toResumeCredentialRecords(credentialResults?.pages.flatMap(page => page?.records ?? [])),
        toResumeCredentialRecords(allCredentialResults?.pages.flatMap(page => page?.records ?? []))
    );
    const isLoading =
        isLoadingExactCredentials ||
        isLoadingAllCredentials ||
        ((isFetchingExactCredentials || isFetchingAllCredentials) && records.length === 0);

    useEffect(() => {
        if (!open || !hasNextExactCredentialsPage || isFetchingNextExactCredentialsPage) return;

        fetchNextExactCredentialsPage();
    }, [
        open,
        hasNextExactCredentialsPage,
        isFetchingNextExactCredentialsPage,
        fetchNextExactCredentialsPage,
        credentialResults?.pages.length,
    ]);

    useEffect(() => {
        if (!open || !hasNextAllCredentialsPage || isFetchingNextAllCredentialsPage) return;

        fetchNextAllCredentialsPage();
    }, [
        open,
        hasNextAllCredentialsPage,
        isFetchingNextAllCredentialsPage,
        fetchNextAllCredentialsPage,
        allCredentialResults?.pages.length,
    ]);

    useEffect(() => {
        if (focusSectionKey !== sectionKey) return;

        setOpen(false);
        hasScrolledAfterLoadRef.current = false;

        const scrollTimer = window.setTimeout(() => {
            wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setIsFocusAnimating(true);
        }, 250);

        const openTimer = window.setTimeout(() => setOpen(true), 900);
        const secondScrollTimer = window.setTimeout(() => {
            wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 1500);
        const animationTimer = window.setTimeout(() => setIsFocusAnimating(false), 1800);

        return () => {
            window.clearTimeout(scrollTimer);
            window.clearTimeout(openTimer);
            window.clearTimeout(secondScrollTimer);
            window.clearTimeout(animationTimer);
        };
    }, [focusRequestId, focusSectionKey, sectionKey]);

    useEffect(() => {
        if (
            focusSectionKey !== sectionKey ||
            !open ||
            isLoading ||
            hasScrolledAfterLoadRef.current
        ) {
            return;
        }

        hasScrolledAfterLoadRef.current = true;

        const loadedScrollTimer = window.setTimeout(() => {
            wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);

        return () => window.clearTimeout(loadedScrollTimer);
    }, [focusRequestId, focusSectionKey, isLoading, open, sectionKey]);
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const filteredRecords = records.filter(record => {
        if (!normalizedSearchQuery) return true;

        const credentialSubject = Array.isArray(record.vc?.credentialSubject)
            ? record.vc?.credentialSubject[0]
            : record.vc?.credentialSubject;
        const credentialSubjectRecord =
            credentialSubject && typeof credentialSubject === 'object'
                ? (credentialSubject as Record<string, unknown>)
                : undefined;
        const achievement =
            credentialSubjectRecord?.achievement &&
            typeof credentialSubjectRecord.achievement === 'object'
                ? (credentialSubjectRecord.achievement as Record<string, unknown>)
                : undefined;
        const boostCredential =
            record.vc?.boostCredential && typeof record.vc.boostCredential === 'object'
                ? (record.vc.boostCredential as Record<string, unknown>)
                : undefined;

        const searchableText = [
            record?.title,
            boostCredential?.name,
            record?.vc?.name,
            credentialSubjectRecord?.name,
            credentialSubjectRecord?.title,
            achievement?.name,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return searchableText.includes(normalizedSearchQuery);
    });
    const selectedCount = selected.length;
    const availabilityLabel = isLoading ? 'Checking...' : `${records.length} available`;
    const statusLabel = isSectionVisible ? 'On' : 'Off';
    const handleSwiperUpdate = (swiper: SwiperInstance) => {
        setAtBeginning(swiper.isBeginning);
        setAtEnd(swiper.isEnd);
    };

    return (
        <div
            ref={wrapperRef}
            className={`bg-white border border-grayscale-200 rounded-2xl border-b overflow-hidden transition-all duration-500 ease-out ${
                isFocusAnimating ? 'ring-2 ring-emerald-400 shadow-lg scale-[1.01]' : ''
            }`}
        >
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
                                {selectedCount} selected • {availabilityLabel} • {statusLabel}
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
            <div
                aria-hidden={!open}
                className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
                    open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
                {open && (
                    <div className="overflow-hidden pb-4">
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
                                        const boostCategory = sectionKey as CredentialCategory;

                                        return (
                                            <SwiperSlide
                                                key={record.uri ?? index}
                                                style={{ width: 'auto' }}
                                                className={`cursor-pointer transition-opacity`}
                                            >
                                                <BoostEarnedCard
                                                    credential={record.vc ?? undefined}
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
                                        className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white text-grayscale-900 p-2 rounded-full z-[1101] shadow-md hover:bg-grayscale-100 transition-all duration-200"
                                        style={{ opacity: 0.85 }}
                                    >
                                        <SlimCaretLeft className="w-5 h-auto" />
                                    </button>
                                )}

                                {(!atBeginning || filteredRecords.length > 2) && (
                                    <button
                                        onClick={() => swiperRef.current?.slideNext()}
                                        aria-label="Next credential"
                                        className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white text-grayscale-900 p-2 rounded-full z-[1101] shadow-md hover:bg-grayscale-100 transition-all duration-200"
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
        </div>
    );
};

export default ResumeConfigCredentialSelector;
