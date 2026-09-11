import React, { useState, useEffect } from 'react';

import Plus from '../../svgs/Plus';
import { IonSpinner } from '@ionic/react';
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
import * as m from '../../../paraglide/messages.js';

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
    const { mutateAsync: setPrimaryContactMethod, isPending: isSetPrimaryLoading } =
        useSetPrimaryContactMethod();
    const { mutateAsync: removeContactMethod, isPending: isRemoveLoading } =
        useRemoveContactMethod();

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
                    {m['profile.phone.header']()}
                </h4>

                <div className="w-full flex flex-1 items-center justify-between">
                    <label htmlFor="contact-phone" className="sr-only">
                        {m['profile.phoneNumber']()}
                    </label>
                    <input
                        id="contact-phone"
                        autoCapitalize="on"
                        className="w-full bg-grayscale-100 text-grayscale-900 placeholder:text-grayscale-400 rounded-[15px] px-4 py-3 font-medium tracking-widest text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent"
                        onChange={event => setPhone(event.target.value)}
                        value={phone ?? ''}
                        placeholder={m['profile.phone.placeholder']()}
                        type="tel"
                        autoComplete="tel"
                    />
                    <button
                        type="button"
                        onClick={() => handleAddContactMethod('phone')}
                        aria-label={`${m['common.add']()} ${m['profile.phoneNumber']()}`}
                        aria-busy={addContactMethodLoading}
                        className={`bg-${primaryColor} rounded-full p-2 m-2`}
                        disabled={addContactMethodLoading}
                    >
                        {addContactMethodLoading ? (
                            <IonSpinner name="crescent" color="light" aria-hidden="true" />
                        ) : (
                            <span aria-hidden="true">
                                <Plus className="text-white w-[25px] h-[25px] min-w-[25px] min-h-[25px]" />
                            </span>
                        )}
                    </button>
                </div>

                {phones.map(phoneItem => (
                    <div
                        key={phoneItem.id}
                        className="w-full flex flex-col items-center justify-start border-b-solid border-b-[1px] border-grayscale-200 pb-2"
                    >
                        <div className="w-full flex items-center justify-between">
                            <p className="text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base flex-1 w-full">
                                {phoneItem.value}
                            </p>

                            <div className="flex items-center justify-end gap-2 rounded-full p-2">
                                {phoneItem.isVerified ? (
                                    <>
                                        <span aria-hidden="true">
                                            <VerifiedBadge size="20" />
                                        </span>
                                        <span className="sr-only">{m['issueFlow.verified']()}</span>
                                    </>
                                ) : (
                                    <div
                                        aria-hidden="true"
                                        className="w-[10px] h-[10px] bg-rose-500 font-bold rounded-full z-50"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end w-full gap-2">
                            <button
                                type="button"
                                onClick={() => handleSetPrimaryContactMethod(phoneItem.id)}
                                disabled={isSetPrimaryLoading}
                                aria-busy={isSetPrimaryLoading}
                                aria-label={`${m['profile.phone.setAsPrimary']()} ${
                                    phoneItem.value
                                }`}
                                className={`bg-${primaryColor} text-white rounded-full px-4 py-2`}
                            >
                                {isSetPrimaryLoading
                                    ? m['common.loading']()
                                    : m['profile.phone.setAsPrimary']()}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRemoveContactMethod(phoneItem.id)}
                                disabled={isRemoveLoading}
                                aria-busy={isRemoveLoading}
                                aria-label={`${m['profile.email.remove']()} ${phoneItem.value}`}
                                className="bg-rose-500 rounded-full p-2"
                            >
                                {isRemoveLoading ? (
                                    <IonSpinner name="crescent" color="light" aria-hidden="true" />
                                ) : (
                                    <span aria-hidden="true">
                                        <TrashBin className="text-white w-[25px] h-[25px] min-w-[25px] min-h-[25px]" />
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserPhoneContacts;
