import React, { useState, useEffect, useMemo } from 'react';

import { IonInput, IonTextarea, IonToggle } from '@ionic/react';

import {
    getMemberTypeText,
    getNetworkState,
    TroopsCMSState,
    TroopsCMSViewModeEnum,
    TroopCMSNetworkFields,
} from '../troopCMSState';
import { GreenScoutsPledge2 } from 'learn-card-base/svgs/ScoutsPledge2';
import { getBadgeThumbnail } from '../troops.helpers';
import { getDefaultBadgeThumbForViewMode } from '../../../helpers/troop.helpers';
import countriesRegions from '../../../constants/countries_organisations_regions.json';
import { useModal, ModalTypes } from 'learn-card-base';
import Checkmark from '../../svgs/Checkmark';
import X from '../../svgs/X';

type TroopCMSContentFormProps = {
    state: TroopsCMSState;
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>;
    viewMode: TroopsCMSViewModeEnum;
    rootViewMode?: TroopsCMSViewModeEnum;
    errors?: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    setErrors?: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
};

export const TroopCMSContentForm: React.FC<TroopCMSContentFormProps> = ({
    state,
    setState,
    viewMode,
    rootViewMode,
    errors,
    setErrors,
}) => {
    const isInGlobalViewMode = viewMode === TroopsCMSViewModeEnum.global;
    const isInNetworkViewMode = viewMode === TroopsCMSViewModeEnum.network;
    const isInTroopViewMode = viewMode === TroopsCMSViewModeEnum.troop;
    const isInMemberViewMode = viewMode === TroopsCMSViewModeEnum.member;
    const isInLeaderViewMode = viewMode === TroopsCMSViewModeEnum.leader;
    const isInIDMode = isInMemberViewMode || isInLeaderViewMode;

    const basicInfo = state?.basicInfo;
    const inheritNetworkContent = state?.inheritNetworkContent;
    const inheritNetworkContentForID = isInMemberViewMode
        ? state?.memberID?.appearance?.inheritNetworkContent
        : state?.appearance?.inheritNetworkContent;

    const [troopNumber, setTroopNumber] = useState<number | string | null>(basicInfo?.name ?? null);
    const [description, setDescription] = useState<string>(basicInfo?.description ?? '');
    const [idDescription, setIdDescription] = useState<string>(
        (isInMemberViewMode
            ? state?.memberID?.appearance?.idDescription
            : state?.appearance?.idDescription) ?? ''
    );

    const [toggleDefaultDescription, setToggleDefaultDescription] = useState<boolean>(
        inheritNetworkContent ?? false
    );
    const [toggleDefaultIDDescription, setToggleDefaultIDDescription] = useState<boolean>(
        inheritNetworkContentForID ?? false
    );

    const network = getNetworkState(state, viewMode, rootViewMode);
    const networkImage =
        network?.appearance?.badgeThumbnail ?? network?.appearance?.idIssuerThumbnail ?? '';

    const thumbnail = getBadgeThumbnail(state);
    const defaultDescription = state.inheritNetworkContent
        ? state.parentID?.basicInfo?.description
        : state?.basicInfo?.description ?? '';
    const defaultDescriptionNoun =
        rootViewMode === TroopsCMSViewModeEnum.global ||
        rootViewMode === TroopsCMSViewModeEnum.network
            ? 'network'
            : 'troop';

    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });

    const countryOptions = useMemo(
        () =>
            [...((countriesRegions as any)?.Countries ?? [])]
                .sort((a: any, b: any) => (a?.Country || '').localeCompare(b?.Country || ''))
                .map((c: any) => c?.Country)
                .filter(Boolean),
        []
    );

    const regionOptions = useMemo(
        () =>
            [...((countriesRegions as any)?.Regions ?? [])]
                .sort((a: any, b: any) => (a?.Region || '').localeCompare(b?.Region || ''))
                .map((r: any) => r?.Region)
                .filter(Boolean),
        []
    );

    const networkTypeOptions = useMemo(() => ['NSO/NSA', 'Event', 'Other'], []);

    const openListModal = (
        title: string,
        options: string[],
        selected: string,
        onSelect: (value: string) => void
    ) => {
        newModal(
            <div className="flex flex-col px-[20px] py-[14px]">
                <div className="flex items-center justify-between w-full max-w-[600px] mx-auto mb-[10px]">
                    <h3 className="text-[22px] text-grayscale-900 font-notoSans">{title}</h3>
                    <button
                        type="button"
                        onClick={closeModal}
                        aria-label="Close modal"
                        className="rounded-full"
                    >
                        <X className="text-grayscale-900 h-auto w-[30px]" />
                    </button>
                </div>
                <div className="w-full max-w-[600px] mx-auto">
                    {options.map(option => (
                        <button
                            key={option}
                            onClick={() => {
                                onSelect(option);
                                closeModal();
                            }}
                            className="flex gap-[10px] items-center py-[12px] text-grayscale-900 border-b-[1px] border-grayscale-200 border-solid last:border-b-0 w-full text-left"
                        >
                            <span className="font-notoSans text-[17px]">{option}</span>
                            {selected === option && (
                                <span className="ml-auto text-grayscale-900">
                                    <Checkmark className="h-[22px] w-[22px]" />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>,
            { mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel }
        );
    };

    useEffect(() => {
        if (isInIDMode && idDescription && toggleDefaultIDDescription) {
            setToggleDefaultIDDescription(false);
        }
    }, [idDescription]);

    let currentMode;
    if (isInNetworkViewMode) {
        currentMode = 'Network';
    } else if (isInGlobalViewMode) {
        currentMode = 'Global Network';
    } else if (isInTroopViewMode) {
        currentMode = 'Troop';
    } else if (isInMemberViewMode) {
        currentMode = 'Scout';
    } else if (isInLeaderViewMode) {
        currentMode = 'Leader';
    } else {
        currentMode = '';
    }

    const handleSetDefaultContent = (toggleState?: boolean) => {
        setState(prevState => {
            return {
                ...prevState,
                inheritNetworkContent: toggleState,
            };
        });
    };

    const handleSetDefaultContentForID = (toggleState?: boolean) => {
        if (isInMemberViewMode) {
            setState(prevState => {
                return {
                    ...prevState,
                    memberID: {
                        ...prevState.memberID,
                        appearance: {
                            ...prevState?.memberID?.appearance,
                            inheritNetworkContent: toggleState,
                        },
                    },
                };
            });
            return;
        }

        setState(prevState => {
            return {
                ...prevState,
                appearance: {
                    ...prevState?.appearance,
                    inheritNetworkContent: toggleState,
                },
            };
        });
    };

    const handleSetState = (key: string, value: any) => {
        setState(prevState => {
            return {
                ...prevState,
                basicInfo: {
                    ...prevState?.basicInfo,
                    [key]: value,
                },
            };
        });
    };

    const handleSetIDState = (key: string, value: any) => {
        if (isInMemberViewMode) {
            setState(prevState => {
                return {
                    ...prevState,
                    memberID: {
                        ...prevState.memberID,
                        appearance: {
                            ...prevState?.memberID?.appearance,
                            [key]: value,
                        },
                    },
                };
            });
            return;
        }
        setState(prevState => {
            return {
                ...prevState,
                appearance: {
                    ...prevState?.appearance,
                    [key]: value,
                },
            };
        });
    };

    const handleSetNetworkField = (key: keyof TroopCMSNetworkFields, value: string) => {
        setState(prevState => {
            return {
                ...prevState,
                networkFields: {
                    ...(prevState?.networkFields ?? {}),
                    [key]: value,
                },
            };
        });
    };

    return (
        <div className="w-full flex items-center justify-center flex-col">
            {(isInMemberViewMode || isInLeaderViewMode) && (
                <div className="w-full mb-2 mt-4">
                    <h3 className="text-grayscale-900 text-left w-full font-notoSans text-[20px] mb-2">
                        Member Type
                    </h3>

                    <IonInput
                        value={getMemberTypeText(rootViewMode, viewMode)}
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-notoSans text-[17px] w-full troops-cms-placeholder"
                        placeholder="Member type"
                        type="text"
                        readonly
                    />
                </div>
            )}

            {(isInNetworkViewMode || isInGlobalViewMode) && (
                <div className="w-full mb-2 mt-4">
                    <h3 className="text-grayscale-900 text-left w-full font-notoSans text-[20px] mb-2">
                        {currentMode} Name
                    </h3>

                    <IonInput
                        value={troopNumber}
                        onIonInput={e => {
                            const _networkName = e.detail.value;
                            setTroopNumber(_networkName);
                            handleSetState('name', _networkName);
                            setErrors?.({});
                        }}
                        className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-notoSans text-[17px] w-full troops-cms-placeholder ${
                            errors?.name ? 'border-red-300 border-2' : ''
                        }`}
                        placeholder={`${currentMode} Name`}
                        clearInput
                        type="text"
                        minlength={1}
                    />

                    {errors?.name && (
                        <div className="text-red-400 font-medium pl-2">{errors?.name}</div>
                    )}
                </div>
            )}

            {(isInNetworkViewMode || isInGlobalViewMode) && (
                <div className="w-full mb-2 mt-2">
                    <h3 className="text-grayscale-900 text-left w-full font-notoSans text-[20px] mb-2">
                        Country
                    </h3>
                    <button
                        type="button"
                        onClick={() =>
                            openListModal(
                                'Select Country',
                                countryOptions,
                                state?.networkFields?.country ?? '',
                                v => handleSetNetworkField('country', v)
                            )
                        }
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-notoSans text-[17px] w-full troops-cms-placeholder text-left"
                    >
                        {state?.networkFields?.country?.trim() || 'Select Country'}
                    </button>
                </div>
            )}

            {(isInNetworkViewMode || isInGlobalViewMode) && (
                <div className="w-full mb-2 mt-2">
                    <h3 className="text-grayscale-900 text-left w-full font-notoSans text-[20px] mb-2">
                        World Scouting Region
                    </h3>
                    <button
                        type="button"
                        onClick={() =>
                            openListModal(
                                'Select Region',
                                regionOptions,
                                state?.networkFields?.region ?? '',
                                v => handleSetNetworkField('region', v)
                            )
                        }
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-notoSans text-[17px] w-full troops-cms-placeholder text-left"
                    >
                        {state?.networkFields?.region?.trim() || 'Select Region'}
                    </button>
                </div>
            )}

            {(isInNetworkViewMode || isInGlobalViewMode) && (
                <div className="w-full mb-2 mt-2">
                    <h3 className="text-grayscale-900 text-left w-full font-notoSans text-[20px] mb-2">
                        Network Type
                    </h3>
                    <button
                        type="button"
                        onClick={() =>
                            openListModal(
                                'Select Network Type',
                                networkTypeOptions,
                                state?.networkFields?.networkType ?? '',
                                v => handleSetNetworkField('networkType', v)
                            )
                        }
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-notoSans text-[17px] w-full troops-cms-placeholder text-left"
                    >
                        {state?.networkFields?.networkType?.trim() || 'Select Network Type'}
                    </button>
                </div>
            )}

            {isInTroopViewMode && (
                <div className="w-full mb-2 mt-4">
                    <h3 className="text-grayscale-900 text-left w-full font-notoSans text-[20px] mb-2">
                        Troop Number
                    </h3>

                    <IonInput
                        value={troopNumber}
                        onIonInput={e => {
                            const _troopNumber = e.detail.value;
                            setTroopNumber(_troopNumber);
                            handleSetState('name', Number(_troopNumber));
                            setErrors?.({});
                        }}
                        className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-notoSans text-[17px] w-full troops-cms-placeholder ${
                            errors?.troopNumber ? 'border-red-300 border-2' : ''
                        }`}
                        placeholder="00000"
                        clearInput
                        type="number"
                        minlength={1}
                        min={0}
                    />

                    {errors?.troopNumber && (
                        <div className="text-red-400 font-medium pl-2">
                            Invalid Troop number entered
                        </div>
                    )}
                </div>
            )}

            <div className="w-full mb-2 mt-4">
                <h3 className="text-grayscale-900 text-left w-full font-notoSans text-[20px] mb-2">
                    About
                </h3>
                {/* allows a troop to toggle the network's description */}
                {isInTroopViewMode && (
                    <div className="w-full flex items-center justify-between px-[8px] py-[8px] mb-2">
                        <div className="text-grayscale-900 text-lg flex items-center justify-start w-[80%]">
                            {!networkImage ? (
                                <div className="max-w-[40px] max-h-[40px] min-h-[40px] min-w-[40px] object-contain rounded-full bg-white mr-[10px] overflow-hidden">
                                    <GreenScoutsPledge2 className="h-auto w-[40px]" />
                                </div>
                            ) : (
                                <div className="max-w-[40px] max-h-[40px] min-h-[40px] min-w-[40px] rounded-full bg-white mr-[10px] overflow-hidden">
                                    <img
                                        src={networkImage}
                                        alt="network thumb"
                                        className="h-[40px] w-[40px] object-cover"
                                    />
                                </div>
                            )}
                            Use network description
                        </div>
                        <IonToggle
                            mode="ios"
                            className="troops-cms-toggle"
                            onIonChange={e => {
                                setToggleDefaultDescription(!toggleDefaultDescription);
                                handleSetDefaultContent(!toggleDefaultDescription);
                            }}
                            checked={toggleDefaultDescription}
                        />
                    </div>
                )}
                {toggleDefaultDescription && isInTroopViewMode && (
                    <p className="font-notoSans text-[17px] text-left px-4 text-grayscale-900">
                        {state?.parentID?.basicInfo?.description}
                    </p>
                )}
                {!isInIDMode && !toggleDefaultDescription && (
                    <>
                        <IonTextarea
                            autoGrow
                            autocapitalize="on"
                            value={description}
                            onIonInput={e => {
                                const _description = e.detail.value;
                                setDescription(_description);
                                handleSetState('description', _description);
                                setErrors?.({});
                            }}
                            placeholder={`${currentMode} description...`}
                            className={`bg-grayscale-100 text-grayscale-900 rounded-[15px] font-normal text-[17px] font-notoSans troops-cms-textarea ${
                                errors?.description ? 'border-red-300 border-2' : ''
                            }`}
                            rows={5}
                            maxlength={620}
                        />
                        {errors?.description && (
                            <div className="text-red-400 font-medium pl-2">
                                {errors?.description}
                            </div>
                        )}
                    </>
                )}

                {/* allows an ID to toggle the networks content */}
                {(isInLeaderViewMode || isInMemberViewMode) && defaultDescription && (
                    <div className="w-full flex items-center justify-between px-[8px] py-[8px] mb-2">
                        <div className="text-grayscale-900 text-lg flex items-center justify-start w-[80%]">
                            {!thumbnail ? (
                                getDefaultBadgeThumbForViewMode(viewMode, 'h-[40px] w-[40px]')
                            ) : (
                                <div className="max-w-[40px] max-h-[40px] min-h-[40px] min-w-[40px] rounded-full bg-white mr-[10px] overflow-hidden">
                                    <img
                                        src={thumbnail}
                                        alt="thumbnail"
                                        className="h-[40px] w-[40px] object-cover"
                                    />
                                </div>
                            )}
                            Use {defaultDescriptionNoun} description
                        </div>
                        <IonToggle
                            mode="ios"
                            className="troops-cms-toggle"
                            onIonChange={e => {
                                setToggleDefaultIDDescription(!toggleDefaultIDDescription);
                                handleSetDefaultContentForID(!toggleDefaultIDDescription);
                            }}
                            checked={toggleDefaultIDDescription}
                        />
                    </div>
                )}
                {toggleDefaultIDDescription && isInIDMode && defaultDescription && (
                    <p className="font-notoSans text-[17px] text-left px-4 text-grayscale-900">
                        {defaultDescription}
                    </p>
                )}
                {isInIDMode && (!toggleDefaultIDDescription || !defaultDescription) && (
                    <>
                        <IonTextarea
                            autoGrow
                            autocapitalize="on"
                            value={idDescription}
                            onIonInput={e => {
                                const _description = e.detail.value;
                                setIdDescription(_description);
                                handleSetIDState('idDescription', _description);
                                setErrors?.({});
                            }}
                            placeholder={`${currentMode} ID description...`}
                            className={`bg-grayscale-100 text-grayscale-900 rounded-[15px] font-normal text-[17px] font-notoSans troops-cms-textarea ${
                                errors?.description ? 'border-red-300 border-2' : ''
                            }`}
                            rows={5}
                            maxlength={620}
                        />
                        {errors?.description && (
                            <div className="text-red-400 font-medium pl-2">
                                {errors?.description}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TroopCMSContentForm;
