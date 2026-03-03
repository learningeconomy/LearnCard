import React from 'react';
import { Updater } from 'use-immer';

import { IonToggle } from '@ionic/react';

import { boostVCTypeOptions } from '../../components/boost/boost-options/boostOptions';
import BrokenLink from '../../components/svgs/BrokenLink';
import AnonymousIcon from '../../assets/images/anonymous.webp';

import { curriedStateSlice } from '@learncard/helpers';

const getInfoFromContractKey = (key: string) => {
    const vcTypeOptions = boostVCTypeOptions?.someone;

    const options = vcTypeOptions.find(options => options.type === key);

    return (
        options ?? {
            IconComponent: BrokenLink,
            title: key,
            type: key,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
        }
    );
};

const ConsentFlowCredentialAccessToggles = ({
    anonymize = false,
    contract,
    terms,
    setState,
    iconOverride,
}: {
    anonymize?: boolean;
    contract: Record<string, { required: boolean }>;
    terms: Record<string, boolean>;
    setState: Updater<Record<string, boolean>>;
    iconOverride?: React.ReactNode;
}) => {
    const updateSlice = curriedStateSlice(setState);

    return (
        <>
            {Object.entries(contract).map(([key, value]) => {
                const { IconComponent, title, iconClassName, iconCircleClass } =
                    getInfoFromContractKey(key);
                const toggleState = terms[key as any];

                const isAnonymousName = anonymize && key === 'Name';

                return (
                    <div className="flex items-center justify-between pb-2 pt-2 border-b-2 border-solid border-grayscale-100 last:border-none">
                        <div className="flex">
                            <div
                                className={`flex items-center justify-center h-[40px] w-[40px] left-1 rounded-full ${iconCircleClass}`}
                            >
                                {iconOverride ?? (
                                    <IconComponent className={`h-[30px] ${iconClassName}`} />
                                )}
                            </div>
                            <h3 className="text-grayscale-900 flex items-center justify-start font-poppins text-xl ml-2">
                                {title}
                            </h3>
                        </div>

                        <IonToggle
                            mode="ios"
                            color="emerald-700"
                            onClick={() => {
                                updateSlice(key, !toggleState);
                            }}
                            disabled={value.required || isAnonymousName}
                            checked={isAnonymousName ? false : toggleState}
                        />
                    </div>
                );
            })}
        </>
    );
};

export default ConsentFlowCredentialAccessToggles;
