import React from 'react';
import { Updater } from 'use-immer';

import GenericCardWrapper from 'learn-card-base/components/GenericCardWrapper/GenericCardWrapper';
import { IonToggle } from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper';
import { ConsentFlowTerms, VC } from '@learncard/types';
import { CredentialCategory } from 'learn-card-base';

import { curriedStateSlice } from '@learncard/helpers';

const vcDisplayWord: Record<CredentialCategory, string> = {
    ID: 'ID',
    Achievement: 'Achievement',
    Skill: 'Skill',
    Membership: 'Membership',
    'Work History': 'Work History',
    'Learning History': 'Learning History',
    'Social Badge': 'Social Badge',
    Hidden: '',
};

const vcColor: Record<CredentialCategory, string> = {
    'Learning History': 'emerald-600',
    ID: 'yellow-400',
    Achievement: 'spice-600',
    Skill: 'indigo-400',
    Membership: 'indigo-400',
    'Work History': 'rose-600',
    'Social Badge': 'cyan-300',
    Hidden: '',
};

type ConsentFlowShareCredentialCardsProps = {
    categories: ConsentFlowTerms['read']['credentials']['categories'];
    setCategories: Updater<ConsentFlowTerms['read']['credentials']['categories']>;
    mappedCredentials: Record<CredentialCategory, { uri: string; vc: VC | undefined }[]>;
    setShareAll: Updater<boolean | undefined>;
};

const ConsentFlowShareCredentialCards: React.FC<ConsentFlowShareCredentialCardsProps> = ({
    categories,
    setCategories,
    mappedCredentials,
    setShareAll,
}) => {
    const updateSlice = curriedStateSlice(setCategories);

    const getTitle = (type: CredentialCategory, count: number) => {
        return `${count} ${vcDisplayWord[type]}${count !== 1 && !['Learning History', 'Work History'].includes(type) ? 's' : ''
            }`;
    };

    return (
        <>
            {Object.entries(mappedCredentials ?? {}).map(([vcType, vcs], index) => {
                const credentials = vcs.filter(vc => Boolean(vc.vc));

                if (credentials.length === 0) return <React.Fragment key={index}></React.Fragment>;

                const category = categories[vcType];
                const updateCategory = curriedStateSlice(updateSlice(vcType));

                return (
                    <React.Fragment key={index}>
                        <section key={vcType} data-testid={`${vcType}-section`}>
                            <div className="flex justify-between items-center mx-[20px] mt-[20px]">
                                <h2 className="text-[20px] font-bold text-gray-900">
                                    {getTitle(
                                        vcType as CredentialCategory,
                                        categories[vcType].shared?.length ?? 0
                                    )}
                                </h2>

                                <span className="flex justify-center items-center font-medium">
                                    All
                                    <IonToggle
                                        onClick={() => {
                                            if (!category?.shareAll) {
                                                updateCategory(
                                                    'shared',
                                                    Array.from(
                                                        new Set([
                                                            ...(category?.shared ?? []),
                                                            ...credentials.map(vc => vc.uri),
                                                        ])
                                                    )
                                                );
                                            } else {
                                                setShareAll(false);
                                            }
                                            updateCategory('shareAll', !category?.shareAll);
                                        }}
                                        slot="end"
                                        className="ml-[10px]"
                                        checked={category?.shareAll}
                                        aria-label={`${vcType} toggle`}
                                    />
                                </span>
                            </div>
                            <Swiper
                                slidesPerView="auto"
                                modules={[Navigation]}
                                navigation
                                spaceBetween={10}
                                className="card-slider"
                            >
                                {credentials.map((credential, index) => {
                                    const isSelected = category?.shared?.includes(credential.uri);

                                    return (
                                        <SwiperSlide key={credential.vc!.id ?? index}>
                                            <GenericCardWrapper
                                                vc={credential.vc!}
                                                uri={credential.uri}
                                                customHeaderClass={`bg-${vcColor[vcType as CredentialCategory]
                                                    }`}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        updateCategory('shareAll', false);
                                                        setShareAll(false);
                                                    }

                                                    updateCategory(
                                                        'shared',
                                                        isSelected
                                                            ? category?.shared?.filter(
                                                                uri => uri !== credential.uri
                                                            )
                                                            : [
                                                                ...(category.shared ?? []),
                                                                credential.uri,
                                                            ]
                                                    );
                                                }}
                                                initialCheckmarkState={isSelected}
                                                showChecked
                                            />
                                        </SwiperSlide>
                                    );
                                })}
                            </Swiper>
                        </section>
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default ConsentFlowShareCredentialCards;
