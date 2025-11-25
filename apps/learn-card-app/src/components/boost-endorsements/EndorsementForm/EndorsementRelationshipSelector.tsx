import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import zod from 'zod';

import { IonInput } from '@ionic/react';
import Checkmark from 'learn-card-base/svgs/Checkmark';

import { useModal } from 'learn-card-base';

import {
    EndorsementRelationshipOptionsEnum,
    EndorsementState,
    relationshipOptions,
} from './endorsement-state.helpers';

const otherRelationSchema = zod.object({
    other: zod.string().min(1, 'Relationship is required'),
});

const EndorsementRelationshipSelector: React.FC<{
    endorsement: EndorsementState;
    setEndorsement: React.Dispatch<React.SetStateAction<EndorsementState>>;
}> = ({ endorsement, setEndorsement }) => {
    const { closeModal } = useModal();
    const sectionPortal = document.getElementById('section-cancel-portal');

    const [other, setOther] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (endorsement?.relationship?.type === EndorsementRelationshipOptionsEnum.Other) {
            setOther(endorsement?.relationship?.label || '');
        }
    }, [endorsement]);

    const validateEndorsement = () => {
        const result = otherRelationSchema.safeParse({ other });
        if (!result.success) {
            setErrors(result.error.flatten().fieldErrors);
            return false;
        }
        return true;
    };

    const handleSelectRelationship = (value: string) => {
        const r = relationshipOptions.find(option => option.type === value);

        setEndorsement(prevState => {
            return {
                ...prevState,
                relationship: {
                    ...prevState.relationship,
                    type: r?.type,
                    label: r?.label,
                },
            };
        });

        closeModal();
    };

    const handleSaveOtherRelationship = () => {
        if (!validateEndorsement()) {
            return;
        }

        setEndorsement(prevState => {
            return {
                ...prevState,
                relationship: {
                    ...prevState.relationship,
                    type: EndorsementRelationshipOptionsEnum.Other,
                    label: other,
                },
            };
        });

        closeModal();
    };

    return (
        <section className="p-[20px] w-full flex flex-col items-center justify-start">
            <h1 className="font-semibold mb-[10px] font-notoSans text-[22px] text-grayscale-900">
                Select Relationship
            </h1>
            {relationshipOptions.map((option, index) => {
                if (option.type === EndorsementRelationshipOptionsEnum.Other) return null;
                const isSelected = option.type === endorsement?.relationship?.type;
                return (
                    <button
                        key={index}
                        onClick={() => handleSelectRelationship(option.type)}
                        className="w-full flex items-center justify-between ion-padding text-grayscale-800 rounded-[15px]  tracking-widest text-lg mb-[10px] text-left"
                    >
                        {option.label}
                        {isSelected ? <Checkmark className="w-7 h-auto text-emerald-700" /> : null}
                    </button>
                );
            })}
            <div className="w-full flex flex-col items-start justify-start">
                <IonInput
                    className={`ion-padding bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base mb-[10px] ${
                        errors?.other ? 'border-red-500' : ''
                    }`}
                    type="text"
                    onIonInput={e => setOther(e.detail.value)}
                    value={other}
                    placeholder="Other..."
                />
                {errors?.other && <p className="text-red-500">{errors?.other}</p>}
            </div>
            {sectionPortal &&
                createPortal(
                    <div className="flex justify-center items-center relative !border-none max-w-[500px] gap-[10px] pb-2">
                        <button
                            onClick={closeModal}
                            className="bg-white text-grayscale-900 text-[17px] py-2 rounded-[20px] w-full h-full shadow-bottom mt-[10px]"
                        >
                            Close
                        </button>
                        {other.length > 0 ? (
                            <button
                                onClick={handleSaveOtherRelationship}
                                className="bg-emerald-700 text-white text-[17px] py-2 rounded-[20px] w-full h-full shadow-bottom mt-[10px]"
                            >
                                Save
                            </button>
                        ) : null}
                    </div>,
                    sectionPortal
                )}
        </section>
    );
};
export default EndorsementRelationshipSelector;
