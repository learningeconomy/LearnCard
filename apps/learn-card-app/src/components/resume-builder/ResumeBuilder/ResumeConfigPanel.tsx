import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import {
    useGetCredentialList,
    BoostCategoryOptionsEnum,
    categoryMetadata,
    CredentialCategoryEnum,
} from 'learn-card-base';
import BoostEarnedCard from '../../boost/boost-earned-card/BoostEarnedCard';
import BoostEarnedIDCard from '../../boost/boost-earned-card/BoostEarnedIDCard';
import SlimCaretLeft from '../../svgs/SlimCaretLeft';
import SlimCaretRight from '../../svgs/SlimCaretRight';
import {
    resumeBuilderStore,
    RESUME_SECTIONS,
    ResumeSectionKey,
    PersonalDetails,
} from '../../../stores/resumeBuilderStore';

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
    <svg
        className={`w-4 h-4 text-grayscale-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const PersonalInfoSection: React.FC = () => {
    const [open, setOpen] = useState(true);
    const personalDetails = resumeBuilderStore.useTracked.personalDetails();
    const setPersonalDetails = resumeBuilderStore.set.setPersonalDetails;

    const fields: {
        key: keyof PersonalDetails;
        label: string;
        placeholder: string;
        multiline?: boolean;
    }[] = [
        { key: 'name', label: 'Full Name', placeholder: 'Jane Doe' },
        { key: 'email', label: 'Email', placeholder: 'jane@example.com' },
        { key: 'phone', label: 'Phone', placeholder: '+1 (555) 000-0000' },
        { key: 'location', label: 'Location', placeholder: 'San Francisco, CA' },
        {
            key: 'summary',
            label: 'Summary',
            placeholder: 'Brief professional summary...',
            multiline: true,
        },
    ];

    return (
        <div className="border-b border-grayscale-100">
            <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpen(o => !o)}
            >
                <span className="text-sm font-semibold text-grayscale-800">Personal Info</span>
                <ChevronIcon open={open} />
            </button>
            {open && (
                <div className="px-4 pb-4 flex flex-col gap-3">
                    {fields.map(({ key, label, placeholder, multiline }) => (
                        <div key={key} className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-grayscale-500">
                                {label}
                            </label>
                            {multiline ? (
                                <textarea
                                    rows={3}
                                    className="w-full text-sm bg-grayscale-50 border border-grayscale-200 rounded-lg px-3 py-2 text-grayscale-800 placeholder-grayscale-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder={placeholder}
                                    value={personalDetails[key]}
                                    onChange={e => setPersonalDetails({ [key]: e.target.value })}
                                />
                            ) : (
                                <input
                                    type="text"
                                    className="w-full text-sm bg-grayscale-50 border border-grayscale-200 rounded-lg px-3 py-2 text-grayscale-800 placeholder-grayscale-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder={placeholder}
                                    value={personalDetails[key]}
                                    onChange={e => setPersonalDetails({ [key]: e.target.value })}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CredentialSection: React.FC<{ sectionKey: ResumeSectionKey; label: string }> = ({
    sectionKey,
    label,
}) => {
    const [open, setOpen] = useState(false);
    const swiperRef = useRef<any>(null);
    const [atBeginning, setAtBeginning] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const selectedCredentialUris = resumeBuilderStore.useTracked.selectedCredentialUris();
    const toggleCredential = resumeBuilderStore.set.toggleCredential;
    const selected = selectedCredentialUris[sectionKey] ?? [];

    const { data: credentialPages, isLoading } = useGetCredentialList(sectionKey as any, open);

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
                <ChevronIcon open={open} />
            </button>
            {open && (
                <div className="pb-4">
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
                            >
                                {records.map((record, index) => {
                                    const isSelected = selected.includes(record.uri);
                                    const boostCategory = record.category as any;
                                    const isID = boostCategory === BoostCategoryOptionsEnum.id;
                                    const isMembership =
                                        boostCategory === BoostCategoryOptionsEnum.membership;

                                    return (
                                        <SwiperSlide
                                            key={record.uri ?? index}
                                            style={{ width: 'auto' }}
                                            onClick={() => toggleCredential(sectionKey, record.uri)}
                                        >
                                            <div
                                                className={`cursor-pointer transition-opacity ${
                                                    isSelected
                                                        ? 'ring-2 ring-indigo-500 rounded-xl'
                                                        : 'opacity-70 hover:opacity-100'
                                                }`}
                                            >
                                                {isID || isMembership ? (
                                                    <div className="mt-6">
                                                        <BoostEarnedIDCard
                                                            record={record}
                                                            categoryType={boostCategory}
                                                            defaultImg={
                                                                categoryMetadata[
                                                                    boostCategory as CredentialCategoryEnum
                                                                ]?.defaultImageSrc ?? ''
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <BoostEarnedCard
                                                        record={record}
                                                        categoryType={boostCategory}
                                                        sizeLg={12}
                                                        sizeMd={12}
                                                        sizeSm={12}
                                                        className="!min-h-[310px]"
                                                    />
                                                )}
                                            </div>
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

const ResumeConfigPanel: React.FC = () => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
                <PersonalInfoSection />
                {RESUME_SECTIONS.map(section => (
                    <CredentialSection
                        key={section.key}
                        sectionKey={section.key as ResumeSectionKey}
                        label={section.label}
                    />
                ))}
            </div>
        </div>
    );
};

export default ResumeConfigPanel;
