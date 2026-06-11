import React from 'react';
import { Updater } from 'use-immer';

import { IonToggle } from '@ionic/react';
import { ConsentFlowTerms, VC } from '@learncard/types';
import { CredentialCategory, GenericCardWrapper, useVerifiableData } from 'learn-card-base';

import { curriedStateSlice } from '@learncard/helpers';

const vcDisplayWord: Partial<Record<CredentialCategory, { singular: string; plural: string }>> = {
    ID: { singular: 'ID', plural: 'IDs' },
    Achievement: { singular: 'Achievement', plural: 'Achievements' },
    Skill: { singular: 'Skill', plural: 'Skills' },
    Membership: { singular: 'Membership', plural: 'Memberships' },
    'Work History': { singular: 'Work History', plural: 'Work History' },
    'Learning History': { singular: 'Learning History', plural: 'Learning History' },
    'Social Badge': { singular: 'Social Badge', plural: 'Social Badges' },
    Goals: { singular: 'Goal', plural: 'Goals' },
    'Professional Title': { singular: 'Professional Title', plural: 'Professional Titles' },
    'Role Experience': { singular: 'Role Experience', plural: 'Role Experiences' },
    'Work Experience': { singular: 'Work Experience', plural: 'Work Experiences' },
    'Pay Rate': { singular: 'Pay Rate', plural: 'Pay Rates' },
    'Work Life Balance': { singular: 'Work Life Balance', plural: 'Work Life Balance' },
    'Job Stability': { singular: 'Job Stability', plural: 'Job Stability' },
    'Self-Assigned Skills': { singular: 'Self-Assigned Skill', plural: 'Self-Assigned Skills' },
    VerifiableData: { singular: 'Verifiable Data', plural: 'Verifiable Data' },
};

const vcColor: Partial<Record<CredentialCategory, string>> = {
    'Learning History': 'emerald-600',
    ID: 'yellow-400',
    Achievement: 'spice-600',
    Skill: 'indigo-400',
    'Self-Assigned Skills': 'indigo-400',
    Membership: 'indigo-400',
    'Work History': 'rose-600',
    'Social Badge': 'cyan-300',
    VerifiableData: 'grayscale-600',
};

type ResolvedCredential = {
    uri: string;
    vc: VC;
};

const formatVerifiableDataSummary = (data: unknown): string => {
    if (data === undefined || data === null) {
        return 'Saved data is unavailable right now.';
    }

    if (typeof data === 'string') {
        return data;
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
        return String(data);
    }

    if (Array.isArray(data)) {
        return `${data.length} item${data.length === 1 ? '' : 's'} saved`;
    }

    if (typeof data === 'object') {
        const entries = Object.entries(data as Record<string, unknown>);

        if (entries.length === 0) {
            return 'Saved data is empty.';
        }

        return entries
            .slice(0, 2)
            .map(([key, value]) => `${key}: ${formatVerifiableDataSummary(value)}`)
            .join(' · ');
    }

    return 'Saved data is available.';
};

const VerifiableDataCredentialCard: React.FC<{
    credential: ResolvedCredential;
    index: number;
    onClick?: () => void;
    initialCheckmarkState: boolean;
}> = ({ credential, index, onClick, initialCheckmarkState }) => {
    const credentialSubject = Array.isArray(credential.vc.credentialSubject)
        ? credential.vc.credentialSubject[0]
        : credential.vc.credentialSubject;

    const dataKey = typeof credentialSubject?.dataKey === 'string' ? credentialSubject.dataKey : '';
    const { data: savedData, isLoading } = useVerifiableData<unknown>(dataKey);

    return (
        <div key={credential.vc!.id ?? index} className="flex flex-col gap-[10px]">
            <GenericCardWrapper
                vc={credential.vc}
                uri={credential.uri}
                customHeaderClass="bg-grayscale-600"
                showChecked
                initialCheckmarkState={initialCheckmarkState}
                onClick={onClick}
            />

            <div className="mx-[20px] rounded-[14px] border border-grayscale-200 bg-grayscale-10 px-[14px] py-[12px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-grayscale-500">
                    {isLoading ? 'Reading saved data' : 'Resolved from your account'}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-grayscale-700">
                    {dataKey
                        ? isLoading
                            ? 'Loading verifiable data...'
                            : formatVerifiableDataSummary(savedData)
                        : 'This credential does not expose a data key.'}
                </p>
            </div>
        </div>
    );
};

type ConsentFlowShareCredentialCardsProps = {
    categories: ConsentFlowTerms['read']['credentials']['categories'];
    setCategories: Updater<ConsentFlowTerms['read']['credentials']['categories']>;
    mappedCredentials: Partial<Record<CredentialCategory, { uri: string; vc: VC | undefined }[]>>;
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
        const displayWord = vcDisplayWord[type] ?? { singular: type, plural: type };
        return `${count} ${count === 1 ? displayWord.singular : displayWord.plural}`;
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] px-[20px] pb-[20px]">
                                {credentials.map((credential, index) => {
                                    const isSelected = category?.shared?.includes(credential.uri);
                                    const handleCredentialClick = () => {
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
                                                : [...(category?.shared ?? []), credential.uri]
                                        );
                                    };

                                    if (vcType === 'VerifiableData') {
                                        if (!credential.vc) {
                                            return <React.Fragment key={index}></React.Fragment>;
                                        }

                                        return (
                                            <VerifiableDataCredentialCard
                                                key={credential.vc!.id ?? index}
                                                credential={credential as ResolvedCredential}
                                                index={index}
                                                onClick={handleCredentialClick}
                                                initialCheckmarkState={Boolean(isSelected)}
                                            />
                                        );
                                    }

                                    return (
                                        <GenericCardWrapper
                                            key={credential.vc!.id ?? index}
                                            vc={credential.vc!}
                                            uri={credential.uri}
                                            customHeaderClass={`bg-${
                                                vcColor[vcType as CredentialCategory] ??
                                                'grayscale-500'
                                            }`}
                                            onClick={handleCredentialClick}
                                            initialCheckmarkState={isSelected}
                                            showChecked
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default ConsentFlowShareCredentialCards;
