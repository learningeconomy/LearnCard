import React, { useState, useEffect } from 'react';

import { Hourglass, Check } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { BoostPageViewMode, BoostCategoryOptionsEnum } from 'learn-card-base';
import { CredentialRecord } from './AppCredentialDashboard';

import { getDefaultCategoryForCredential, getFallBackImage } from 'learn-card-base';
import { BoostEarnedCard } from '../../components/boost/boost-earned-card/BoostEarnedCard';

interface CredentialCardProps {
    record: CredentialRecord;
    isNew?: boolean;
    index: number;
}

const CredentialCard: React.FC<CredentialCardProps> = ({ record, isNew, index }) => {
    const [isAnimating, setIsAnimating] = useState(isNew);

    useEffect(() => {
        if (isNew) {
            const timer = setTimeout(() => setIsAnimating(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isNew]);

    // Get credential info
    const credential = record.credential;
    const subject = Array.isArray(credential?.credentialSubject)
        ? credential?.credentialSubject[0]
        : credential?.credentialSubject;

    const title = credential?.name || subject?.achievement?.name || 'Credential';
    const category = credential
        ? getDefaultCategoryForCredential(credential) || BoostCategoryOptionsEnum.achievement
        : BoostCategoryOptionsEnum.achievement;

    const categoryDisplayMap: Record<string, string> = {
        'Learning History': 'Studies',
        'Work History': 'Experiences',
        'Social Badge': 'Boosts',
        'Accomodation': 'Assistance',
        'Accomplishment': 'Portfolio',
    };
    const updatedCategory = categoryDisplayMap[category] || category;

    const formattedDate = record.dateEarned.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <div
            className={`
                bg-white rounded-xl shadow-sm overflow-hidden relative
                transition-all duration-500 ease-out
                ${
                    isAnimating
                        ? 'animate-slide-in-right ring-2 ring-indigo-400 ring-opacity-50'
                        : ''
                }
            `}
            style={{
                animationDelay: isNew ? '0ms' : `${index * 50}ms`,
            }}
        >
            {/* New Indicator - Absolute positioned top right */}
            {isNew && (
                <div className="absolute top-2 right-2 z-10">
                    <span className="inline-flex px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full animate-pulse font-poppins">
                        NEW
                    </span>
                </div>
            )}

            <div className="p-4 max-h-[250px]">
                <div className="flex items-start gap-4">
                    {/* Credential Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex">
                            <img
                                className="w-[20px] h-[20px] mr-[5px]"
                                src={getFallBackImage(category)}
                            />
                            <h4 className="font-semibold font-poppins text-gray-900 truncate">
                                {title}
                            </h4>
                        </div>

                        <div className="flex items-center gap-2 mt-[8px] text-sm text-gray-900 font-poppins">
                            <span>Earned {formattedDate}</span>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-[8px] flex xs:flex-col xs:items-start">
                            {record.status === 'claimed' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full font-poppins">
                                    <Check className="w-3 h-3" />
                                    Claimed
                                </span>
                            )}
                            {record.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-sm font-medium rounded-full font-poppins">
                                    <Hourglass className="w-3 h-3" />
                                    Pending
                                </span>
                            )}
                            {/* Category Tag */}
                            <span className="ml-2 xs:ml-0 xs:mt-2 inline-flex px-2 py-0.5 bg-gray-100 text-gray-900 text-sm rounded-full capitalize font-poppins">
                                {updatedCategory}
                            </span>
                        </div>
                    </div>

                    {/* Credential Preview */}
                    <div className={`w-20 flex-shrink-0 mr-[35px] ${isNew ? 'mt-6' : ''}`}>
                        {credential ? (
                            <BoostEarnedCard
                                credential={credential}
                                categoryType={category}
                                boostPageViewMode={BoostPageViewMode.Card}
                                useWrapper={false}
                                verifierState={false}
                                hideOptionsMenu
                                className="!mt-0 scale-75 origin-top-left"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <IonSpinner name="crescent" className="w-6 h-6 text-indigo-400" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CredentialCard;
