import React from 'react';

import { IonSpinner } from '@ionic/react';
import BulkBoostParentSelectorModal from './BulkParentSelector/BulkParentSelectorModal';
import X from 'apps/learn-card-app/src/components/svgs/X';

import { boostCategoryOptions, ModalTypes, useGetBoost, useModal } from 'learn-card-base';
import BulkImportWithPlusIcon from 'learn-card-base/svgs/BulkImportWithPlusIcon';

type BulkBoostParentSelectorProps = {
    parentUri?: string;
    setParentUri: React.Dispatch<React.SetStateAction<string>>;
};

const BulkBoostParentSelector: React.FC<BulkBoostParentSelectorProps> = ({
    parentUri,
    setParentUri,
}) => {
    const { newModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });

    const { data: parentBoost, isLoading } = useGetBoost(parentUri);

    const { category, name, boost } = parentBoost ?? {};
    const { color } = boostCategoryOptions[category] ?? {};

    const presentModal = () => {
        newModal(
            <BulkBoostParentSelectorModal parentUri={parentUri} setParentUri={setParentUri} />,
            { sectionClassName: '!max-w-[600px]', hideButton: true }
        );
    };

    return (
        <div className="flex flex-col gap-[3px] w-full">
            <button
                onClick={() => presentModal()}
                className="w-full rounded-full pl-2 pr-4 flex items-center justify-between border-[1px] border-solid border-grayscale-300 h-[58px]"
                type="button"
            >
                {!parentUri && (
                    <div className="flex items-center justify-start w-full">
                        <BulkImportWithPlusIcon className="mr-2 h-[40px] w-[40px]" />
                        <div className="flex flex-col items-start justify-center">
                            <p className="text-xs text-emerald-700 font-semibold">
                                Parent Credential
                            </p>
                            <p className="text-[17px] text-grayscale-800">None</p>
                        </div>
                    </div>
                )}
                {parentUri && (
                    <>
                        <div className="flex items-center justify-start">
                            <div className="w-[40px] h-[40px] rounded-full bg-white mr-2 overflow-hidden shrink-0">
                                {isLoading ? (
                                    <div className="w-full flex items-center justify-center">
                                        <IonSpinner
                                            name="crescent"
                                            color="grayscale-900"
                                            className="scale-[1] mt-1"
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={boost?.image}
                                        alt="network thumb"
                                        className="w-full h-full object-cover shrink-0"
                                    />
                                )}
                            </div>
                            <div className="flex flex-col items-start justify-center">
                                <h4
                                    className={`text-${color} font-bold p-0 m-0 text-xs font-notoSans`}
                                >
                                    {category}
                                </h4>

                                {isLoading ? (
                                    <p className="m-0 p-0 text-lg font-notoSans text-grayscale-900 line-clamp-1">
                                        ...
                                    </p>
                                ) : (
                                    <p className="m-0 p-0 text-lg font-notoSans text-grayscale-900 line-clamp-1">
                                        {name}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            className="shrink-0"
                            onClick={e => {
                                e.stopPropagation();
                                setParentUri('');
                            }}
                        >
                            <X className="text-grayscale-900 h-[20px] w-[20px]" />
                        </button>
                    </>
                )}
            </button>
        </div>
    );
};

export default BulkBoostParentSelector;
