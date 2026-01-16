import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useFlags } from 'launchdarkly-react-client-sdk';

import {
    useFilestack,
    UploadRes,
    BoostCategoryOptionsEnum,
    isCustomBoostType,
    replaceUnderscoresWithWhiteSpace,
    getAchievementTypeFromCustomType,
    useModal,
    ModalTypes,
} from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import { IonRow, IonSpinner, IonGrid } from '@ionic/react';
import {
    boostCategoryOptions,
    CATEGORY_TO_SUBCATEGORY_LIST,
} from '../../../boost-options/boostOptions';
import useHighlightedCredentials from 'apps/scouts/src/hooks/useHighlightedCredentials';

import BoostCMSIDCard from '../../../boost-id-card/BoostIDCard';
import Pencil from '../../../../svgs/Pencil';
// @ts-ignore
import EmptyImage from 'learn-card-base/assets/images/empty-image.png';
import TrashBin from '../../../../svgs/TrashBin';
import X from 'learn-card-base/svgs/X';
import { BoostCMSActiveAppearanceForm } from './BoostCMSAppearanceFormModal';
import BoostIDCardCMSAppearanceForm from '../../BoostIDCardCMS/BoostIDCardCMSForms/BoostIDCardCMSAppearanceForm';

import { BoostCMSState } from '../../../boost';
import BoostIDCardCMSIssuerThumbnailForm from '../../BoostIDCardCMS/BoostIDCardCMSForms/BoostIDCardCMSIssuerThumbnailForm';

const BoostCMSAppearanceForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;

    activeCategoryType: BoostCategoryOptionsEnum;
    setActiveForm: React.Dispatch<React.SetStateAction<BoostCMSActiveAppearanceForm>>;

    handleCloseModal: () => void;
    handleSaveAppearance: () => void;
}> = ({
    state,
    setState,
    disabled = false,

    activeCategoryType,
    setActiveForm,
    handleCloseModal,
    handleSaveAppearance,
}) => {
    const flags = useFlags();
    const { credentials } = useHighlightedCredentials();

    // Check if user is Global Admin or National Admin
    const isAdmin = credentials.some(cred =>
        ['ext:GlobalID', 'ext:NetworkID'].includes(
            cred?.credentialSubject?.achievement?.achievementType
        )
    );

    const categoryMetadata = boostCategoryOptions[activeCategoryType];
    const { CategoryImage } = categoryMetadata || {};

    const isDefaultImage = state?.appearance?.badgeThumbnail === CategoryImage;

    const isID = state?.basicInfo?.type === BoostCategoryOptionsEnum.id;
    const isMembership = state?.basicInfo?.type === BoostCategoryOptionsEnum.membership;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_image, setImage] = useState<string>(state?.appearance?.backgroundImage || '');
    const [uploadProgress, setUploadProgress] = useState<number | false>(false);

    const handleStateChange = (propName: string, value: any) => {
        setState(prevState => {
            return {
                ...prevState,
                appearance: {
                    ...prevState.appearance,
                    [propName]: value,
                },
            };
        });
    };

    const handleColorChange = (hex: string) => handleStateChange('backgroundColor', hex);

    const { newModal: newColorPickerModal, closeModal: closeColorPickerModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const presentColorPicker = () => {
        newColorPickerModal(
            <div className="flex flex-col items-center justify-center w-full h-full transparent">
                <div className="flex items-center justify-center mb-2">
                    <button
                        onClick={() => closeColorPickerModal()}
                        className="w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center shadow-3xl"
                    >
                        <X className="text-black w-[30px]" />
                    </button>
                </div>
                <HexColorPicker
                    color={
                        state?.appearance?.backgroundColor
                            ? state?.appearance?.backgroundColor
                            : '#353E64'
                    }
                    onChange={handleColorChange}
                />
            </div>
        );
    };

    const handleColorInputOnChange = (value: string) => {
        let updatedValue;

        if (value !== '') updatedValue = value.startsWith('#') ? value : `#${value}`;

        handleStateChange('backgroundColor', updatedValue);

        return;
    };

    const handleDeleteImageUploaded = () => {
        setImage('');
        handleStateChange('backgroundImage', '');
    };

    const onUpload = (data: UploadRes) => {
        setImage(data?.url);
        setUploadProgress(false);
        handleStateChange('backgroundImage', data?.url);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let achievementTypeSelected;

    if (isCustomBoostType(state?.basicInfo?.achievementType)) {
        achievementTypeSelected = replaceUnderscoresWithWhiteSpace(
            getAchievementTypeFromCustomType(state?.basicInfo?.achievementType)
        );
    } else {
        achievementTypeSelected =
            CATEGORY_TO_SUBCATEGORY_LIST?.[state?.basicInfo?.type as any]?.find(
                (options: any) => options?.type === state?.basicInfo?.achievementType
            )?.title ?? '';
    }

    let formBackgroundColor: string = '';

    const {
        subColor: _subColor,
    } = boostCategoryOptions[state?.basicInfo?.type as BoostCategoryOptionsEnum];
    formBackgroundColor = state?.appearance?.backgroundColor
        ? state?.appearance?.backgroundColor
        : '#353E64';

    return (
        <IonGrid
            className="w-full h-full ion-no-padding flex justify-center items-start"
            style={{
                backgroundColor: formBackgroundColor,
            }}
        >
            <IonRow
                className="w-full flex flex-col items-center justify-center max-w-[600px] ion-padding"
                style={{
                    backgroundColor: state?.appearance?.backgroundColor
                        ? state?.appearance?.backgroundColor
                        : '#353E64',
                }}
            >
                {(isID || isMembership) && (
                    <BoostCMSIDCard state={state} setState={setState} idFooterClassName="mb-4" />
                )}

                {isID || isMembership ? (
                    <>
                        <BoostIDCardCMSAppearanceForm state={state} setState={setState} />
                        <BoostIDCardCMSIssuerThumbnailForm state={state} setState={setState} />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center bg-white rounded-[20px] w-full ion-padding font-medium text-lg mb-4">
                        <h3 className="text-grayscale-700 text-left w-full">Badge Thumbnail</h3>
                        <div className="flex items-center justify-between w-full bg-grayscale-100 rounded-full mt-4">
                            <div className="flex items-center justify-start w-[70%] px-[6px] py-[6px] overflow-hidden">
                                <div
                                    className={`flex items-center justify-center rounded-full object-contain overflow-hidden w-[72px] h-[72px] bg-${_subColor}`}
                                >
                                    <img
                                        alt="badge thumbnail"
                                        src={state?.appearance?.badgeThumbnail}
                                    />
                                </div>
                                {isDefaultImage && (
                                    <p className="ml-[10px] text-grayscale-700">Default</p>
                                )}
                            </div>

                            <div className="flex items-center justify-center rounded-full bg-white mr-4 h-[50px] w-[50px] shadow-3xl">
                                <button
                                    onClick={() =>
                                        setActiveForm(BoostCMSActiveAppearanceForm.badgeForm)
                                    }
                                    className="bg-white"
                                    disabled={disabled}
                                >
                                    <Pencil className="text-grayscale-900 h-[30px] w-[30px]" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Allow admins to upload background images even when CMS customization is disabled */}
                {(!flags?.disableCmsCustomization || isAdmin) && (
                    <div className="flex flex-col items-center justify-center bg-white rounded-[20px] w-full ion-padding font-medium text-lg mb-4">
                        <h3 className="text-grayscale-700 text-left w-full">
                            {isID || isMembership
                                ? 'Container Background Image'
                                : 'Background Image'}
                        </h3>

                        <div className="flex items-center justify-between w-full bg-grayscale-100 rounded-tl-[10px] rounded-bl-[10px] rounded-tr-[50px] rounded-br-[50px] mt-4">
                            <div className="flex items-center justify-start w-[70%] px-[6px] py-[6px] overflow-hidden">
                                <div
                                    className={`relative flex items-center justify-center object-contain overflow-hidden w-[72px] h-[72px] bg-grayscale-800 rounded-[10px]`}
                                >
                                    {!state?.appearance?.backgroundImage ? (
                                        <img
                                            alt="badge thumbnail"
                                            src={EmptyImage}
                                            className="w-[43px] h-[47px]"
                                        />
                                    ) : (
                                        <img
                                            alt="badge thumbnail"
                                            src={state?.appearance?.backgroundImage}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    {(imageUploadLoading || uploadProgress !== false) && (
                                        <div className="absolute z-50 flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl min-w-[70px] min-h-[70px] user-image-upload-inprogress">
                                            <IonSpinner
                                                name="crescent"
                                                color="dark"
                                                className="scale-[1.75]"
                                            />
                                        </div>
                                    )}
                                    {state?.appearance?.backgroundImage && (
                                        <button
                                            onClick={handleDeleteImageUploaded}
                                            className="absolute flex items-center justify-center right-1 bottom-1 rounded-full bg-white h-[30px] w-[30px] z-50 shadow-3xl"
                                            disabled={disabled}
                                        >
                                            <TrashBin className="text-grayscale-800 h-[20px] w-[20px]" />
                                        </button>
                                    )}
                                </div>
                                {!state?.appearance?.backgroundImage && (
                                    <p className="ml-[10px] text-grayscale-700">Empty</p>
                                )}
                            </div>

                            <div className="flex items-center justify-center rounded-full bg-white mr-4 h-[50px] w-[50px] shadow-3xl">
                                <button
                                    disabled={disabled}
                                    onClick={handleImageSelect}
                                    className="bg-white"
                                >
                                    <Pencil className="text-grayscale-900 h-[30px] w-[30px]" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center justify-center bg-white rounded-[20px] w-full ion-padding font-medium text-lg mb-4">
                    <h3 className="text-grayscale-700 text-left w-full">
                        {isID ? 'Container Background Color' : 'Background Color'}
                    </h3>

                    <div className="w-full flex items-center justify-center p-0 m-0 mt-4">
                        <div className="relative w-full flex items-center justify-between">
                            <input
                                value={state?.appearance?.backgroundColor}
                                onChange={e => handleColorInputOnChange(e.target.value)}
                                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base w-full pr-10"
                                placeholder="Color Hex Code"
                                type="text"
                                disabled={disabled}
                            />
                        </div>

                        <button
                            onClick={() => {
                                presentColorPicker();
                            }}
                            className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] rounded-[10px] ml-2"
                            style={{
                                backgroundColor: state?.appearance?.backgroundColor
                                    ? state?.appearance?.backgroundColor
                                    : '#353E64',
                            }}
                            disabled={disabled}
                        />
                    </div>
                </div>

                <div className="w-full flex flex-col items-center justify-center z-50 mt-4">
                    <button
                        onClick={() => {
                            handleSaveAppearance();
                            handleCloseModal();
                        }}
                        className="flex items-center justify-center bg-emerald-700 rounded-full mb-4 px-[12px] py-[8px] text-white text-2xl w-full max-w-[320px] shadow-lg font-notoSans"
                    >
                        Save
                    </button>
                    <button
                        onClick={() => handleCloseModal()}
                        className="text-white text-center text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </IonRow>
        </IonGrid>
    );
};

export default BoostCMSAppearanceForm;
