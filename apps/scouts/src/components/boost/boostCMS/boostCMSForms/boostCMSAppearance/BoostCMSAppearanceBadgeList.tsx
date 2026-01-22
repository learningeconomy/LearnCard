import React, { useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { useFilestack, UploadRes, LCAStylesPackRegistryEntry, useModal, ModalTypes } from 'learn-card-base';
import { useScoutPassStylesPackRegistry } from 'learn-card-base/hooks/useRegistry';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import { IonCol, IonGrid, IonRow, IonSpinner } from '@ionic/react';
import TransparentGrid from 'learn-card-base/assets/images/transparent-grid.png';
import Camera from 'learn-card-base/svgs/Camera';
import HourGlass from '../../../../../assets/lotties/hourglass.json';
import TrashBin from '../../../../svgs/TrashBin';
import Lottie from 'react-lottie-player';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import { CATEGORY_TO_SUBCATEGORY_LIST } from '../../../boost-options/boostOptions';
import { BoostCategoryOptionsEnum } from 'learn-card-base';

import { BoostCMSState } from '../../../boost';
import {
    BoostUserTypeEnum,
    boostCategoryOptions,
    boostVCTypeOptions,
} from '../../../boost-options/boostOptions';
import BoostVCTypeOptionButton from '../../../boost-options/boostVCTypeOptions/BoostVCTypeOptionButton';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import { BoostCMSActiveAppearanceForm } from './BoostCMSAppearanceFormHeader';
import { SetState } from '@learncard/helpers';
import useHighlightedCredentials from 'apps/scouts/src/hooks/useHighlightedCredentials';
import { StylePackCategoryModal } from './StylePackCategoryModal';

export enum StylePackCategories {
    all = 'All',
    socialBadge = 'Social Badge',
    achievement = 'Achievement',
    course = 'Course',
    job = 'Job',
    id = 'ID',
    workHistory = 'Work History',
    currency = 'Currency',
    learningHistory = 'Learning History',
    skill = 'Skill',
    meritBadge = 'Merit Badge',
}

const getFilteredStylePack = (
    stylePackImageList: LCAStylesPackRegistryEntry[] | undefined,
    stylePackCategory: StylePackCategories
) => {
    const mergedList = [
        ...(CATEGORY_TO_SUBCATEGORY_LIST?.[BoostCategoryOptionsEnum.meritBadge]?.map(item => ({
            category: 'Merit Badge',
            type: item.type,
            url: item.image,
        })) || []),
        ...(stylePackImageList || []),
    ];

    if (stylePackCategory === StylePackCategories.all) return mergedList || [];
    return mergedList?.filter(sp => sp.category === stylePackCategory) || [];
};

export const BoostCMSAppearanceBadgeList: React.FC<{
    state: BoostCMSState;
    setState: SetState<BoostCMSState>;
    handleCloseModal: () => void;
    disabled?: boolean;
    boostUserType: BoostUserTypeEnum;
    setActiveForm: SetState<BoostCMSActiveAppearanceForm>;
}> = ({
    state,
    setState,
    handleCloseModal,
    disabled = false,
    boostUserType,
    setActiveForm,
}) => {
    const { newModal } = useModal();
    const flags = useFlags();
    const { credentials } = useHighlightedCredentials();

    // Check if user is Global Admin or National Admin
    const isAdmin = credentials.some(cred => {
        const subject = cred?.credentialSubject;
        if (!subject || Array.isArray(subject)) return false;
        return ['ext:GlobalID', 'ext:NetworkID'].includes(
            subject?.achievement?.achievementType
        );
    });

    const { data: boostAppearanceBadgeList, isLoading } = useScoutPassStylesPackRegistry();

    const categoryMetadata =
        boostCategoryOptions[state?.basicInfo?.type as BoostCategoryOptionsEnum];
    const { CategoryImage } = categoryMetadata || {};
    const isDefaultImage = state?.appearance?.badgeThumbnail === CategoryImage;
    const type = state?.basicInfo?.type;
    const targetType = type === 'Social Badge' ? 'Boost' : type;

    const [activeStylePackCategory, setActiveStylePackCategory] = useState<StylePackCategories>(
        StylePackCategories.all
    );

    const [photo, setPhoto] = useState<string>(state?.appearance?.badgeThumbnail ?? '');
    const [uploadProgress, setUploadProgress] = useState<number | false>(false);

    const handleStateChange = (propName: string, value: any) => {
        setState({
            ...state,
            appearance: {
                ...state.appearance,
                [propName]: value,
            },
        });
    };

    const handleDeleteImageUploaded = () => {
        setPhoto('');
        handleStateChange('badgeThumbnail', CategoryImage);
    };

    const onUpload = (data: UploadRes) => {
        setPhoto(data?.url);
        setUploadProgress(false);
        handleStateChange('badgeThumbnail', data?.url);
        // if (state?.appearance?.badgeThumbnail && uploadProgress === false) {
        //     handleCloseModal();
        // }
        setActiveForm(BoostCMSActiveAppearanceForm.appearanceForm);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    let _boostAppearanceBadgeList: LCAStylesPackRegistryEntry[] | undefined = [];

    if (!isLoading) {
        _boostAppearanceBadgeList = getFilteredStylePack(
            boostAppearanceBadgeList,
            activeStylePackCategory
        );
    }

    const handleOpenCategoryModal = () => {
        newModal(
            <StylePackCategoryModal
                activeStylePackCategory={activeStylePackCategory}
                setActiveStylePackCategory={setActiveStylePackCategory}
                boostUserType={boostUserType}
                targetType={targetType}
            />,
            {},
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    let categoryButton = null;
    if (activeStylePackCategory === StylePackCategories.all) {
        categoryButton = (
            <button
                onClick={handleOpenCategoryModal}
                className="rounded-full p-0 text-base font-semibold bg-white text-grayscale-800 px-3 py-2 flex items-center justify-center border border-gray-300 w-[180px] relative"
            >
                <span>All</span>
                <CaretLeft
                    className="h-auto w-[5px] text-grayscale-800 rotate-[-90deg] absolute right-3"
                />
            </button>
        );
    } else {
        const { IconComponent, title, color } = boostCategoryOptions[activeStylePackCategory];

        categoryButton = (
            <button
                onClick={handleOpenCategoryModal}
                className="rounded-full p-0 text-base font-semibold bg-white text-grayscale-800 px-3 py-2 flex items-center justify-center border border-gray-300 w-[180px] relative"
            >
                <div className="flex items-center gap-1">
                    <IconComponent className={`h-[20px] w-[20px] text-${color}`} />
                    <span>{title}</span>
                </div>
                <CaretLeft
                    className="h-auto w-[5px] text-grayscale-800 rotate-[-90deg] absolute right-3"
                />
            </button>
        );
    }

    return (
        <IonRow className="flex w-full">
            <IonCol className="boost-cms-badge-container">
                {isLoading ? (
                    <div className="flex flex-col w-full h-full items-center justify-center">
                        <div className="max-w-[160px] m-auto flex justify-center">
                            <Lottie
                                loop
                                animationData={HourGlass}
                                play
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                        <p className="mt-2 font-mouse text-3xl">Loading...</p>
                    </div>
                ) : (
                    <div className="w-full max-w-3xl mx-auto px-4 flex flex-wrap items-start justify-center">
                        <div className="w-full flex items-center justify-between bg-white px-4 py-3 mb-4 rounded-lg shadow-sm">
                            <p className="text-grayscale-900 font-semibold text-base whitespace-nowrap mr-2">Style Pack</p>
                            {categoryButton}
                        </div>
                        {/* Allow admins to upload custom images even when CMS customization is disabled */}
                        {(!flags?.disableCmsCustomization || isAdmin) && (
                            <button onClick={handleImageSelect} className="boost-cms-badge">
                                <Camera className="boost-cms-camera-icon text-white" />
                                <span className="upload-text">Upload</span>
                            </button>
                        )}
                        {photo && !isDefaultImage && (
                            <div className="boost-cms-badge">
                                <img
                                    className="absolute left-0 top-0 w-full h-full object-cover z-50"
                                    src={photo}
                                    alt="badge"
                                />
                                <img
                                    className="absolute left-0 top-0 w-full h-full"
                                    src={TransparentGrid}
                                    alt="transparent grid"
                                />
                                {imageUploadLoading && (
                                    <div className="absolute z-50 flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl min-w-[70px] min-h-[70px] user-image-upload-inprogress">
                                        <IonSpinner name="crescent" color="dark" className="scale-[1.75]" />
                                    </div>
                                )}
                                <button onClick={handleDeleteImageUploaded} className="trash-button">
                                    <TrashBin className="trash-icon" />
                                </button>
                            </div>
                        )}
                        {!photo && imageUploadLoading && (
                            <div
                                className={`text-white overflow-hidden bg-grayscale-900 relative flex flex-col items-center justify-center text-center w-[28%] h-[122px] boost-cms-badge m-2 rounded-[20px] px-2 shadow-3xl`}
                            >
                                <img
                                    className="absolute left-0 top-0 w-full h-full"
                                    src={TransparentGrid}
                                    alt="transparent grid"
                                />
                                <div className="absolute flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl min-w-[70px] min-h-[70px] user-image-upload-inprogress">
                                    <IonSpinner name="crescent" color="dark" className="scale-[1.75]" />
                                </div>
                            </div>
                        )}
                        {_boostAppearanceBadgeList?.map(({ url }, index) => {
                            return (
                                <button
                                    onClick={() => {
                                        handleStateChange('badgeThumbnail', url);
                                        setActiveForm(BoostCMSActiveAppearanceForm.appearanceForm);
                                        // handleCloseModal();
                                    }}
                                    key={index}
                                    className={`overflow-hidden relative flex flex-col items-center justify-center text-center w-[28%] h-[122px] boost-cms-badge m-2 rounded-[20px] shadow-3xl`}
                                >
                                    <img
                                        className="absolute left-0 top-0 w-full h-full"
                                        src={TransparentGrid}
                                        alt="transparent grid"
                                    />
                                    <img
                                        className="text-white z-50 w-full h-full object-cover"
                                        src={url}
                                        alt="badge"
                                    />
                                </button>
                            );
                        })}
                    </div>
                )}
            </IonCol>
        </IonRow>
    );
};

export default BoostCMSAppearanceBadgeList;
