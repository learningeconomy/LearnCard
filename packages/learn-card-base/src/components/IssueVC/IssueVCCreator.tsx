import React, { useState, useEffect, useRef } from 'react';
import {
    IonButton,
    IonList,
    IonInput,
    IonItem,
    IonLabel,
    IonTextarea,
    IonCheckbox,
    IonSpinner,
    useIonToast,
} from '@ionic/react';
import { addCredentialSelfAttest } from './helpers';
import { Capacitor } from '@capacitor/core';
import useWallet from 'learn-card-base/hooks/useWallet';
import { CATEGORY_TO_TEMPLATE_LIST } from './constants';
import { useImmer, Updater } from 'use-immer';
import { CredentialCategory } from 'learn-card-base/types/credentials';
import keyboardStore from 'learn-card-base/stores/keyboardStore';
import { KnownAchievementType } from '@learncard/types';

/** Generates a default generic VC template state */
const genericVCTemplateState = {
    name: '',
    description: '',
    narrative: '',
};

const GenericTemplateFields: React.FC<{ state; setState }> = ({ state, setState }) => {
    const handleName = e => {
        setState({
            ...state,
            name: e?.target?.value,
        });
    };
    const handleDescription = e => {
        setState({
            ...state,
            description: e?.target?.value,
        });
    };
    const handleNarrative = e => {
        setState({
            ...state,
            narrative: e?.target?.value,
        });
    };

    return (
        <IonList>
            <IonItem counter={true}>
                <IonLabel position="stacked">Name</IonLabel>
                <IonInput
                    autocapitalize="on"
                    maxlength={80}
                    required
                    onIonInput={handleName}
                    placeholder="Credential name"
                ></IonInput>
            </IonItem>

            <IonItem counter={true}>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                    autocapitalize="on"
                    maxlength={200}
                    onIonInput={handleDescription}
                    autoGrow
                    required
                    placeholder="A brief description of the credential"
                ></IonTextarea>
            </IonItem>

            <IonItem counter={true}>
                <IonLabel position="stacked">Criteria</IonLabel>
                <IonTextarea
                    autocapitalize="on"
                    maxlength={200}
                    onIonInput={handleNarrative}
                    autoGrow
                    required
                    placeholder="A brief description of the what criteria this credential satisfies"
                ></IonTextarea>
            </IonItem>
        </IonList>
    );
};

const ChooseIssueVCTarget: React.FC = () => {
    const [checked, setChecked] = useState('selfissue');

    return (
        <IonList>
            <IonItem>
                <IonLabel className="full-opacity">Self-Issue</IonLabel>
                <IonCheckbox
                    className="full-opacity"
                    slot="start"
                    checked={checked === 'selfissue'}
                    readonly
                    disabled
                ></IonCheckbox>
            </IonItem>

            <IonItem>
                <IonLabel>Select from address book (Coming soon)</IonLabel>
                <IonCheckbox slot="start" disabled></IonCheckbox>
            </IonItem>

            <IonItem>
                <IonLabel>Enter a DID address (Coming soon)</IonLabel>
                <IonCheckbox slot="start" disabled></IonCheckbox>
            </IonItem>
        </IonList>
    );
};

const IssueVCCreator: React.FC<{ category: CredentialCategory; closeModal?: any }> = ({
    category,
    closeModal,
}) => {
    const [step, setStep] = useState(1);
    const [wallet, setWallet] = useState(null);
    const { initWallet } = useWallet();

    useEffect(() => {
        initWallet().then(res => {
            setWallet(res);
        });
    }, []);

    // this is achievement type, not credential category
    const [templateType, setTemplateType] = useState<KnownAchievementType>('Achievement');

    const [templateTitle, setTemplateTitle] = useState('credential');
    const [loading, setLoading] = useState(false);
    const [valid, setValid] = useState(false);
    const [presentToast] = useIonToast();

    const [templateState, setTemplateState] = useImmer(genericVCTemplateState);

    useEffect(() => {
        // primitive validation/replace
        if (
            templateState?.name?.trim() !== '' &&
            templateState?.description?.trim() !== '' &&
            templateState?.narrative?.trim() !== ''
        ) {
            setValid(true);
        }
    }, [templateState]);

    const { addVCtoWallet } = useWallet();

    if (!category) return <></>;

    const displayList = CATEGORY_TO_TEMPLATE_LIST[category];

    const handleShowFields = template => {
        // template type here is not to be confused with CredentialCategory
        // template type is of type KnownAchievementType
        setTemplateType(template?.type);
        setTemplateTitle(template?.title);
        setStep(2);
    };

    const renderDisplayList = displayList?.map(template => {
        return (
            <IonItem
                onClick={() => handleShowFields(template)}
                type="button"
                className="vc-list-btn px-[15px] my-[10px] normal-case"
                slot="end"
                color="primary"
                button
                aria-label={template?.title}
                key={template?.title}
            >
                {template?.title}
            </IonItem>
        );
    });

    const STEP_TO_TITLE = {
        1: 'What kind of credential?',
        2: `Who do you want to issue a ${templateTitle} credential to? `,
        3: `Enter the following information for this ${templateTitle} credential`,
    };

    const STEP_TO_BUTTON_TEXT = {
        1: 'Next Step',
        2: 'Next Step',
        3: 'Create Credential',
    };

    const stepTitle = STEP_TO_TITLE[step];

    const handleNext = async () => {
        const nextStep = step < 3 ? step + 1 : 3;

        if (step < 3) {
            setStep(nextStep);
        }

        if (step === 3 && valid && wallet) {
            // create Credential
            try {
                const payload = {
                    name: templateState?.name,
                    description: templateState?.description,
                    narrative: templateState?.narrative,
                    type: category, // main category
                    achievementType: templateType, // sub type
                };
                setLoading(true);
                // currently only handling self attest case, will need to be expanded
                // to handle other cases
                const issuedVcUri = await addCredentialSelfAttest(payload, wallet);
                await addVCtoWallet({ uri: issuedVcUri });
                setLoading(false);
                closeModal?.();
                presentToast({
                    message: `Successfully created ${templateTitle}`,
                    duration: 3000,
                    cssClass: 'toast-custom-class ion-toast-bottom-nav-offset',
                });
            } catch (e) {
                console.log('error', e);
                closeModal?.();
                presentToast({
                    message: `Error creating ${templateTitle}`,
                    duration: 3000,
                    cssClass: 'toast-custom-class ion-toast-bottom-nav-offset',
                });
            }
        } else {
            throw new Error('No wallet found or invalid input');
        }
    };

    const bottomNavText = STEP_TO_BUTTON_TEXT[step];

    const isDisabled = !valid && step === 3;

    let btnClass =
        'mt-[10px] min-h-[50px] max-w-[600px] m-auto z-[1000] w-full bg-grayscale-900 py-[15px] px-[2px] rounded-[40px] text-grayscale-50 text-[17px] font-bold';

    if (isDisabled) btnClass = `${btnClass} opacity-50`;

    const bottomBarRef = useRef<HTMLDivElement>();

    const bottomBarClass =
        'z-[1000] fixed-bottom-container left-[0px] fixed w-full bottom-[0px] p-[20px] h-[147px] bg-grayscale-50 flex flex-col';

    keyboardStore.store.subscribe(({ isOpen }) => {
        if (isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className = `${bottomBarClass} hidden`;
        }
        if (!isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className = `${bottomBarClass}`;
        }
    });

    return (
        <div className="vc-template-creator pt-[20px]">
            <div className="px-[15px] font-semibold text-gray-900">
                <p>{stepTitle}</p>
            </div>
            <div>
                {step === 1 && <IonList lines="none">{renderDisplayList}</IonList>}
                {step === 2 && (
                    <section>
                        <ChooseIssueVCTarget />
                    </section>
                )}
                {step === 3 && (
                    <section>
                        <GenericTemplateFields state={templateState} setState={setTemplateState} />
                    </section>
                )}
            </div>

            {step !== 1 && (
                <section ref={bottomBarRef} className={bottomBarClass}>
                    <button
                        type="button"
                        disabled={isDisabled}
                        onClick={handleNext}
                        className={btnClass}
                    >
                        {bottomNavText}
                    </button>
                </section>
            )}

            {loading && (
                <div className="z-[1000] create-vc-loading h-full bg-opacity-60 bg-grayscale-50 fixed top-[0px] left-[0px] flex flex-col justify-center items-center w-full h-full">
                    <div className="loading-content mt-[-150px]  flex flex-col justify-center items-center">
                        <p className="font-semibold pb-[20px] text-gray-900">
                            Creating Verified Credential...
                        </p>
                        <IonSpinner className="" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default IssueVCCreator;
