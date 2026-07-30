import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle, ellipseOutline } from 'ionicons/icons';

import { VC, UnsignedVC } from '@learncard/types';
import { BoostPreviewDisplayViewEnum, boostPreviewStore } from 'learn-card-base/stores/boostPreviewStore';
import { getSvgMustacheRenderMethod } from '@learncard/render-method-plugin';

type BoostDisplayStyleSelectorProps = {
    credential: VC | UnsignedVC;
    enableRenderMethod: boolean;
};

const BoostDisplayStyleSelector: React.FC<BoostDisplayStyleSelectorProps> = ({
    credential,
    enableRenderMethod,
}) => {
    const renderMethod = enableRenderMethod ? getSvgMustacheRenderMethod(credential as VC) : null;
    const selectedDisplayView = boostPreviewStore.useTracked.selectedDisplayView();

    if (!renderMethod) return null;

    const setSelectedDisplayView = boostPreviewStore.set.updateSelectedDisplayView;

    const displayOptions = [
        {
            id: BoostPreviewDisplayViewEnum.Default,
            title: 'Default View',
            description: 'Optimized LearnCard credential display.',
        },
        {
            id: BoostPreviewDisplayViewEnum.Issuer,
            title: 'Issuer View',
            description: 'Show the credential as designed by the issuer.',
        },
    ] as const;

    return (
        <section className="rounded-[20px] border border-grayscale-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4">
                <h3 className="text-[17px] text-grayscale-900">Display Style</h3>
            </div>

            <div className="px-3 pb-3">
                {displayOptions.map((option, index) => {
                    const isSelected = selectedDisplayView === option.id;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedDisplayView(option.id)}
                            className={`w-full flex items-start gap-2 rounded-[18px] px-3 py-4 text-left ${
                                index > 0 ? 'border-t border-grayscale-200' : ''
                            }`}
                        >
                            <IonIcon
                                icon={isSelected ? checkmarkCircle : ellipseOutline}
                                className={`text-[28px] shrink-0 mt-0.5 ${
                                    isSelected ? 'text-emerald-600' : 'text-grayscale-300'
                                }`}
                            />
                            <div className="">
                                <p className="text-[17px] font-semibold text-grayscale-900">
                                    {option.title}
                                </p>
                                <p className="text-sm text-grayscale-700 leading-relaxed">
                                    {option.description}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default BoostDisplayStyleSelector;
