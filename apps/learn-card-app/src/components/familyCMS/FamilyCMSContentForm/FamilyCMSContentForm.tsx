import React, { useState } from 'react';
import { EmojiClickData } from 'emoji-picker-react';

import { IonInput, IonTextarea, IonToggle, useIonModal } from '@ionic/react';
import FamilyEmojiPicker from '../FamilyCMSEmojiPicker/FamilyEmojiPicker';
import EmojiRenderer from '../FamilyCMSEmojiPicker/FamilyCMSEmojiRenderer';
import X from '../../svgs/X';

import { FamilyCMSState } from '../familyCMSState';
import { ModalTypes, useModal } from 'learn-card-base';

type FamilyCMSContentFormProps = {
    state: FamilyCMSState;
    setState: React.Dispatch<React.SetStateAction<FamilyCMSState>>;
    errors?: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    setErrors?: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
};

export const FamilyCMSContentForm: React.FC<FamilyCMSContentFormProps> = ({
    state,
    setState,
    errors,
    setErrors,
}) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const [familyName, setFamilyName] = useState<string>(state?.basicInfo?.name ?? '');
    const [description, setDescription] = useState<string>(state?.basicInfo?.description ?? '');

    const [toggleFamilyEmoji, setToggleFamilyEmoji] = useState<boolean>(
        state?.appearance?.toggleFamilyEmoji ?? false
    );
    const [emoji, setEmoji] = useState<EmojiClickData | null | undefined>(
        state?.appearance?.emoji ?? null
    );

    const handleSetState = (topLevelKey: string, key: string, value: string) => {
        setState(prevState => {
            return {
                ...prevState,
                [topLevelKey]: {
                    ...prevState?.[topLevelKey],
                    [key]: value,
                },
            };
        });
    };

    const handleSetEmoji = (_emoji: EmojiClickData) => {
        setEmoji(_emoji);
        setState(prevState => {
            return {
                ...prevState,
                appearance: {
                    ...prevState?.appearance,
                    emoji: _emoji,
                },
            };
        });
    };

    const presentEmojiPicker = () => {
        newModal(
            <FamilyEmojiPicker handleSetEmoji={handleSetEmoji} handleCloseModal={closeModal} />,
            { sectionClassName: '!bg-transparent !shadow-none !w-fit' }
        );
    };

    return (
        <div className="bg-white w-full flex items-center justify-center flex-col z-9999">
            <div className="w-full mb-2 mt-4">
                <h3 className="text-grayscale-900 text-left w-full font-poppins text-[20px] mb-2">
                    Family name
                </h3>

                <div className="relative">
                    <IonInput
                        value={familyName}
                        onIonInput={e => {
                            const _familyName = e?.detail?.value;
                            setFamilyName(_familyName);

                            handleSetState('basicInfo', 'name', _familyName);
                            setErrors?.({});
                        }}
                        className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] !pr-4 flex ion-padding font-normal font-poppins text-[17px] w-full troops-cms-placeholder ${errors?.name ? 'border-red-300 border-2' : ''
                            }`}
                        placeholder="Family Name"
                        // clearInput
                        type="text"
                    />

                    {familyName.length > 0 && (
                        <button
                            onClick={() => {
                                setFamilyName('');
                                handleSetState('basicInfo', 'name', '');
                            }}
                            className="absolute top-[34%] right-[3%] z-10"
                        >
                            <X className="text-grayscale-900 h-[20px] w-[20px]" />
                        </button>
                    )}
                </div>

                {errors?.name && (
                    <div className="text-red-400 font-medium pl-1 mt-1">{errors?.name}</div>
                )}
            </div>

            <div className="w-full flex items-center justify-between py-[8px] mb-2">
                <div className="text-grayscale-900 text-lg flex items-center justify-start w-[80%]">
                    Add a Family Emoji
                </div>
                <IonToggle
                    mode="ios"
                    className="family-cms-toggle"
                    onIonChange={e => {
                        setToggleFamilyEmoji(!toggleFamilyEmoji);
                        handleSetState('appearance', 'toggleFamilyEmoji', !toggleFamilyEmoji);
                    }}
                    checked={toggleFamilyEmoji}
                />
            </div>
            {toggleFamilyEmoji && (
                <div className="w-full flex items-center justify-start">
                    <button
                        className="w-[50px] h-[50px] bg-grayscale-200 rounded-[15px]"
                        onClick={() => presentEmojiPicker()}
                    >
                        {emoji && <EmojiRenderer data={emoji} />}
                    </button>
                </div>
            )}

            <div className="w-full mb-2 mt-4">
                <h3 className="text-grayscale-900 text-left w-full font-poppins text-[20px] mb-2">
                    Family Motto
                </h3>

                <div className="relative">
                    <IonTextarea
                        aria-label="motto"
                        autoGrow
                        autocapitalize="on"
                        value={description}
                        onIonInput={e => {
                            const _familyMotto = e.detail.value;
                            setDescription(_familyMotto);
                            handleSetState('basicInfo', 'description', _familyMotto);

                            setErrors?.({});
                        }}
                        placeholder="About my family..."
                        className={`bg-grayscale-100 text-grayscale-900 rounded-[15px] font-normal text-[17px] font-poppins p-4 troops-cms-placeholder ${errors?.description ? 'border-red-300 border-2' : ''
                            }`}
                        rows={5}
                        maxlength={620}
                    />
                    {description.length > 0 && (
                        <button
                            onClick={() => {
                                setDescription('');
                                handleSetState('basicInfo', 'description', '');
                            }}
                            className="absolute top-[8%] right-[3%] z-10"
                        >
                            <X className="text-grayscale-900 h-[20px] w-[20px]" />
                        </button>
                    )}
                    {errors?.description && (
                        <div className="text-red-400 font-medium pl-1 mt-1">
                            {errors?.description}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FamilyCMSContentForm;
