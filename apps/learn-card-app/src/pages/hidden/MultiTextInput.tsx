import React from 'react';
import { produce } from 'immer';

import TrashBin from '../../components/svgs/TrashBin';
import Plus from 'learn-card-base/svgs/Plus';
import { IonInput, IonCheckbox } from '@ionic/react';

type MultiTextInputProps = {
    values: Record<string, { required?: boolean }>;
    onChange: (value: Record<string, { required?: boolean }>) => void;
    label?: string;
    buttonText?: string;
    className?: string;
    style?: 'custom-wallet' | 'admin-dashboard';
};

const MultiTextInput: React.FC<MultiTextInputProps> = ({
    values,
    onChange,
    label = '',
    buttonText = '',
    className = '',
    style = 'custom-wallet',
}) => {
    const isAdminDashboardStyle = style === 'admin-dashboard';

    const inputs = Object.entries(values).map(([category, value], index) => (
        <li className="flex gap-2 items-center w-full" key={index}>
            <IonInput
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base ion-padding"
                type="text"
                onIonInput={e =>
                    onChange(
                        produce(values, draft => {
                            delete draft[category];
                            draft[e.detail.value] = value;
                        })
                    )
                }
                placeholder="Field name"
                value={category}
            />

            <label className="flex items-center gap-2 justify-end rounded-full text-xs text-grayscale-800">
                Required
                <IonCheckbox
                    checked={value.required}
                    onIonChange={e =>
                        onChange(
                            produce(values, draft => {
                                draft[category] = { required: e.detail.checked };
                            })
                        )
                    }
                    color="emerald-700"
                />
            </label>

            <button
                type="button"
                onClick={() =>
                    onChange(
                        produce(values, draft => {
                            delete draft[category];
                        })
                    )
                }
            >
                <TrashBin version="thin" className="w-[24px] h-[24px]" />
            </button>
        </li>
    ));

    return (
        <section className={`flex flex-col gap-[8px] ${className}`}>
            <p>{label}</p>
            {inputs.length > 0 && <ul className="w-full flex flex-col gap-2">{inputs}</ul>}
            {!isAdminDashboardStyle && (
                <button
                    type="button"
                    className="transition-colors h-full w-full rounded border border-solid py-2 border-emerald-600 hover:text-white hover:bg-emerald-600"
                    onClick={() =>
                        onChange(
                            produce(values, draft => {
                                if (!draft['']) draft[''] = { required: false };
                            })
                        )
                    }
                >
                    {buttonText}
                </button>
            )}
            {isAdminDashboardStyle && (
                <button
                    type="button"
                    className="py-[5px] px-[10px] bg-white rounded-[20px] w-fit text-[16px] shadow-box-bottom disabled:opacity-60 flex gap-[5px] items-center border-solid border-[1px] border-grayscale-200 hover:bg-grayscale-100 transition-colors"
                    onClick={() =>
                        onChange(
                            produce(values, draft => {
                                if (!draft['']) draft[''] = { required: false };
                            })
                        )
                    }
                >
                    <Plus className="h-[16px] w-[16px]" /> {buttonText}
                </button>
            )}
        </section>
    );
};

export default MultiTextInput;
