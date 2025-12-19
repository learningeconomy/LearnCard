import React, { useState } from 'react';

import { walletPageData } from '../../pages/wallet/constants';
import { CredentialCategoryEnum, walletSubtypeToCredentialCategory } from 'learn-card-base';
import { WalletCategoryTypes } from 'learn-card-base/components/IssueVC/types';

export const CategorySelector: React.FC<{
    activeCategory: CredentialCategoryEnum;
    handleOnClick: (category: string) => void;
    hideFamily?: boolean;
}> = ({ activeCategory, handleOnClick, hideFamily = false }) => {
    const [category, setCategory] = useState<CredentialCategoryEnum | null>(activeCategory ?? null);

    return (
        <div className="w-full flex flex-col justify-center p-4">
            <h2 className="text-[22px] font-semibold text-grayscale-900 w-full text-center">
                Select Category
            </h2>
            <div className="w-full flex flex-col justify-center">
                {walletPageData.map(c => {
                    const { title, WalletIcon, ShapeIcon, id, shapeColor } = c;

                    if (
                        c.subtype === WalletCategoryTypes.aiSessions ||
                        c.subtype === WalletCategoryTypes.aiPathways ||
                        c.subtype === WalletCategoryTypes.aiInsights ||
                        c.subtype === WalletCategoryTypes.skills ||
                        (hideFamily && c.subtype === WalletCategoryTypes.families)
                    )
                        return null;

                    const isActive = walletSubtypeToCredentialCategory(c.subtype) === category;

                    return (
                        <button
                            key={id}
                            className={`w-full flex items-center justify-start p-4 rounded-[15px] ${
                                isActive ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => {
                                handleOnClick(walletSubtypeToCredentialCategory(c.subtype));
                                setCategory(walletSubtypeToCredentialCategory(c.subtype));
                            }}
                        >
                            {WalletIcon && (
                                <div className="w-[35px] h-[35px] flex items-center justify-center relative">
                                    <ShapeIcon className={shapeColor} />
                                    <WalletIcon className="w-[35px] h-[35px] text-white mr-2 z-10 absolute top-0 left-0" />
                                </div>
                            )}
                            <h2 className="text-[18px] font-normal text-grayscale-800 ml-2 font-poppins">
                                {title}
                            </h2>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CategorySelector;
