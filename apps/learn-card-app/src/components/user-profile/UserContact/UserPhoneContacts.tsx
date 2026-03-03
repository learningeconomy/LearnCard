import React, { useState, useEffect } from 'react';

import Plus from '../../svgs/Plus';
import { IonInput } from '@ionic/react';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import VerifiedBadge from 'learn-card-base/svgs/VerifiedBadge';

import {
    useGetMyContactMethods,
    useAddContactMethod,
    useVerifyContactMethod,
    useSetPrimaryContactMethod,
    useRemoveContactMethod,
} from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';

type ContactMethodType =
    | {
          type: 'email';
          value: string;
          id: string;
          createdAt: string;
          isPrimary: boolean;
          isVerified: boolean;
          verifiedAt?: string | undefined;
      }
    | {
          type: 'phone';
          value: string;
          id: string;
          createdAt: string;
          isPrimary: boolean;
          isVerified: boolean;
          verifiedAt?: string | undefined;
      };

export const UserPhoneContacts: React.FC = () => {
    const [phone, setPhone] = useState<string | null | undefined>(null);

    const [phones, setPhones] = useState<ContactMethodType[]>([]);

    const { data: contactMethods, refetch: refetchContactMethods } = useGetMyContactMethods();

    const { mutateAsync: addContactMethod, isPending: addContactMethodLoading } =
        useAddContactMethod();
    const { mutateAsync: verifyContactMethod } = useVerifyContactMethod();
    const { mutateAsync: setPrimaryContactMethod } = useSetPrimaryContactMethod();
    const { mutateAsync: removeContactMethod } = useRemoveContactMethod();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const handleSetExistingContactMethods = () => {
        if (contactMethods) {
            const phoneContactMethods = contactMethods.filter(
                contactMethod => contactMethod.type === 'phone'
            );

            setPhones(phoneContactMethods ?? []);
        }
    };

    const handleAddContactMethod = async (type: 'phone') => {
        if (type === 'phone' && phone) {
            await addContactMethod({ type: 'phone', value: phone });
            setPhone(null);
            setPhones(prev => [
                ...prev,
                {
                    type: 'phone',
                    value: phone,
                    id: '',
                    createdAt: '',
                    isPrimary: false,
                    isVerified: false,
                },
            ]);
            refetchContactMethods();
            return;
        }
    };

    const handleSetPrimaryContactMethod = async (contactMethodId: string) => {
        await setPrimaryContactMethod({ contactMethodId });
    };

    const handleRemoveContactMethod = async (contactMethodId: string) => {
        await removeContactMethod({ id: contactMethodId });
    };

    useEffect(() => {
        handleSetExistingContactMethods();
    }, [contactMethods]);

    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl py-6 px-4 mt-4 rounded-[15px]">
            <div className="w-full flex items-start justify-center flex-col gap-2">
                <h4 className="text-grayscale-900 text-[22px] font-semibold font-notoSans text-left">
                    Phone
                </h4>

                <div className="w-full flex flex-1 items-center justify-between">
                    <IonInput
                        autocapitalize="on"
                        className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base`}
                        onIonInput={e => setPhone(e.detail.value)}
                        value={phone}
                        placeholder="Phone"
                        type="tel"
                    />
                    <button
                        onClick={() => handleAddContactMethod('phone')}
                        className={`bg-${primaryColor} rounded-full p-2 m-2`}
                        disabled={addContactMethodLoading}
                    >
                        <Plus className="text-white w-[25px] h-[25px] min-w-[25px] min-h-[25px]" />
                    </button>
                </div>

                {phones.map(phone => (
                    <div
                        key={phone.id}
                        className="w-full flex flex-col items-center justify-start border-b-solid border-b-[1px] border-grayscale-200 pb-2"
                    >
                        <div className="w-full flex items-center justify-between">
                            <p className="text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base flex-1 w-full">
                                {phone.value}
                            </p>

                            <div className="flex items-center justify-end gap-2 rounded-full p-2">
                                {phone.isVerified ? (
                                    <VerifiedBadge size="20" />
                                ) : (
                                    <div className="w-[10px] h-[10px] bg-rose-500  font-bold rounded-full z-50" />
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end w-full gap-2">
                            <button
                                onClick={() => handleSetPrimaryContactMethod(phone.id)}
                                className={`bg-${primaryColor} rounded-full px-4 py-2`}
                            >
                                Set as Primary
                            </button>
                            <button
                                onClick={() => handleRemoveContactMethod(phone.id)}
                                className="bg-rose-500 rounded-full p-2"
                            >
                                <TrashBin className="text-white w-[25px] h-[25px] min-w-[25px] min-h-[25px]" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserPhoneContacts;
