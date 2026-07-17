import React, { useMemo } from 'react';
import {
    useGetCredentialList,
    useModal,
    ModalTypes,
    categoryMetadata,
    CredentialCategoryEnum,
} from 'learn-card-base';
import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import { AllCredentialsModal } from './AllCredentialsModal';
import { resolveActivityCategory, isHiddenActivity } from './activityFeed.helpers';

const MAX_ITEMS = 5;

type IndexRecord = {
    id?: string;
    uri: string;
    category?: string;
    title?: string;
    date?: string;
    imgUrl?: string;
};

export const RecentlyAdded: React.FC = () => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const { data } = useGetCredentialList(undefined);

    const openSeeAll = () =>
        newModal(<AllCredentialsModal onClose={closeModal} />, {
            hideButton: true,
            sectionClassName: '!max-w-[760px]',
        });

    const items = useMemo(() => {
        const records = (data?.pages?.flatMap(p => p?.records ?? []) ?? []) as IndexRecord[];
        return records
            .filter(r => r?.uri && !isHiddenActivity(r.category))
            .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
            .slice(0, MAX_ITEMS);
    }, [data]);

    if (items.length === 0) return null;

    return (
        <div className="mb-[24px]">
            <div className="flex items-center justify-between mb-[10px]">
                <h3 className="font-poppins text-[13px] tracking-[1px] text-grayscale-500">
                    RECENTLY ADDED
                </h3>
                <button
                    type="button"
                    onClick={openSeeAll}
                    className="font-poppins text-[13px] font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
                >
                    See all
                </button>
            </div>
            <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:gap-2 md:overflow-visible md:px-0 md:flex-wrap">
                {items.map(record => {
                    const category = resolveActivityCategory(record.category);
                    return (
                        <div key={record.uri} className="shrink-0 snap-start">
                            <BoostEarnedCard
                                record={record}
                                categoryType={category}
                                defaultImg={
                                    categoryMetadata[category as CredentialCategoryEnum]
                                        ?.defaultImageSrc
                                }
                                useWrapper={false}
                                hideOptionsMenu
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecentlyAdded;
