import React, { useEffect, useState } from 'react';

import { IonInput } from '@ionic/react';
import Search from 'learn-card-base/svgs/Search';
import CaretDown from 'learn-card-base/svgs/CaretDown';
import BulkParentSelectorCredentialList from './BulkParentSelectorCredentialList';
import BulkParentSelectorCategoryFilter from './BulkParentSelectoCategoryFilter';

import {
    ModalTypes,
    boostCategoryMetadata,
    BoostCategoryOptionsEnum,
    useModal,
} from 'learn-card-base';

type ViewAllManagedBoostsProps = {
    parentUri?: string;
    setParentUri: React.Dispatch<React.SetStateAction<string>>;
};

export const ignoredCategories = [
    BoostCategoryOptionsEnum.currency, // not implemented
    BoostCategoryOptionsEnum.describe, // not implemented
    BoostCategoryOptionsEnum.skill, // not a real boost type
    BoostCategoryOptionsEnum.job, // covered by workHistory
    BoostCategoryOptionsEnum.membership, // covered by IDs
    BoostCategoryOptionsEnum.course, // covered by learningHistory
    BoostCategoryOptionsEnum.all,
];

const BulkParentSelectorModal: React.FC<ViewAllManagedBoostsProps> = ({
    parentUri,
    setParentUri,
}) => {
    const { closeModal, newModal } = useModal();

    const [searchInput, setSearchInput] = useState<string | undefined>('');
    const [activeCategory, setActiveCategory] = useState<BoostCategoryOptionsEnum>(
        BoostCategoryOptionsEnum.all
    );
    const [categoryTitle, setCategoryTitle] = useState<string>('All');

    useEffect(() => {
        setCategoryTitle(boostCategoryMetadata[activeCategory].title);
    }, [activeCategory]);

    const handleCategoryFilter = () => {
        newModal(
            <BulkParentSelectorCategoryFilter
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
            />,
            {
                sectionClassName: 'max-w-[400px]',
            },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    let categories = Object.values(BoostCategoryOptionsEnum);
    if (activeCategory !== BoostCategoryOptionsEnum.all) {
        categories = categories.filter(category => {
            return category === activeCategory;
        });
    }

    const { IconWithShape, AltIconWithShapeForColorBg } = boostCategoryMetadata[activeCategory];

    return (
        <div className="flex flex-col bg-grayscale-100 h-full relative">
            <div className="absolute top-0 left-0 bg-white px-2 py-2 shadow-header w-full z-10">
                <div
                    role="button"
                    onClick={() => {
                        handleCategoryFilter();
                    }}
                    className="flex items-center justify-between p-2 z-50"
                >
                    <div className="flex items-center">
                        {AltIconWithShapeForColorBg ? (
                            <AltIconWithShapeForColorBg className="mr-2 h-[60px] w-[60px]" />
                        ) : (
                            <IconWithShape className="mr-2 h-[60px] w-[60px]" />
                        )}
                        <div className="flex flex-col items-start justify-center">
                            <h5 className="text-[22px]  text-grayscale-800 font-notoSans">
                                {categoryTitle}
                            </h5>
                        </div>
                    </div>
                    <div className="flex items-center justify-end">
                        <CaretDown className="h-[20px] w-[20px] text-grayscale-900" />
                    </div>
                </div>
            </div>
            <section className="flex-1 flex-col gap-[10px] w-full ion-padding overflow-y-scroll pt-[100px] pb-[120px]">
                <div className="flex-1 relative my-4">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-[5]">
                        <Search className="text-grayscale-900 w-[24px] h-[24px]" />
                    </div>
                    <IonInput
                        type="text"
                        value={searchInput}
                        placeholder="Browse Credentials"
                        onIonInput={e => setSearchInput(e.detail.value)}
                        className="bg-white text-grayscale-800 rounded-[15px] !py-[4px] font-normal !font-notoSans text-[17px] !pl-[48px]"
                    />
                </div>
                {categories.map(category => (
                    <BulkParentSelectorCredentialList
                        key={category}
                        category={category}
                        parentUri={parentUri}
                        setParentUri={setParentUri}
                        searchInput={searchInput}
                    />
                ))}
            </section>
            <footer className="absolute bottom-0 p-[20px] bg-white bg-opacity-70 backdrop-blur-[5px] border-t-[1px] border-solid border-white w-full z-20">
                <div className="max-w-[600px] flex items-center justify-between mx-auto w-full gap-[10px]">
                    <button
                        onClick={closeModal}
                        className="bg-white flex-1 p-[7px] text-grayscale-900 font-poppins text-[17px] rounded-[30px] border-[1px] border-solid border-grayscale-200 shadow-button-bottom h-[44px]"
                    >
                        Close
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default BulkParentSelectorModal;
