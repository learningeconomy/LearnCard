import React, { useState, useEffect } from 'react';
import { z } from 'zod';

import Plus from '../../svgs/Plus';
import { IonInput, IonSpinner } from '@ionic/react';
import UserEmailContactItem from './UserEmailContactItem';

import { EMAIL_REGEX, useGetMyContactMethods, useAddContactMethod } from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';
import { IconSetEnum } from '../../../theme/icons';

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

const StateValidator = z.object({
    email: z.string().regex(EMAIL_REGEX, `Missing or Invalid Email`),
});

export const UserEmailContacts: React.FC = () => {
    const [email, setEmail] = useState<string | null | undefined>(null);
    const [emails, setEmails] = useState<ContactMethodType[]>([]);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const { getIconSet, colors } = useTheme();
    const icons = getIconSet(IconSetEnum.placeholders);
    const primaryColor = colors?.defaults?.primaryColor;
    const { floatingBottle: FloatingBottleIcon } = icons;

    const { data: contactMethods, refetch: refetchContactMethods } = useGetMyContactMethods();

    const { mutateAsync: addContactMethod, isPending: addContactMethodLoading } =
        useAddContactMethod();

    const handleSetExistingContactMethods = () => {
        if (contactMethods) {
            const emailContactMethods = contactMethods.filter(
                contactMethod => contactMethod.type === 'email'
            );

            setEmails(emailContactMethods ?? []);
        }
    };

    const validate = () => {
        const parsedData = StateValidator.safeParse({
            email: email,
        });

        if (parsedData?.success) {
            setErrors({});
            return true;
        }

        if (parsedData?.error) {
            setErrors(parsedData.error.flatten().fieldErrors);
        }

        return false;
    };

    const handleAddContactMethod = async () => {
        if (email && validate()) {
            await addContactMethod({ type: 'email', value: email?.toLowerCase() });
            setEmail(null);
            setEmails(prev => [
                ...prev,
                {
                    type: 'email',
                    value: email?.toLowerCase() ?? '',
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

    useEffect(() => {
        handleSetExistingContactMethods();
    }, [contactMethods]);

    return (
        <div className="w-full items-center justify-center flex flex-col pb-6 px-2">
            <div className="w-full flex items-start justify-center flex-col gap-2">
                <div className="w-full flex flex-col flex-1 items-center justify-between mb-2">
                    <div className="w-full flex items-center justify-center">
                        <div className="w-full flex items-center justify-start">
                            <IonInput
                                autocapitalize="on"
                                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base ${
                                    errors.email ? 'border-rose-500 border-[1px] border-solid' : ''
                                }`}
                                onIonInput={e => {
                                    setEmail(e.detail.value);
                                    setErrors({});
                                }}
                                value={email}
                                placeholder="Email"
                                type="text"
                            />
                        </div>
                        <button
                            onClick={() => handleAddContactMethod()}
                            className={`bg-${primaryColor} rounded-full p-2 ml-4 w-[50px] h-[50px] min-w-[50px] min-h-[50px] flex items-center justify-center`}
                            disabled={addContactMethodLoading}
                        >
                            {addContactMethodLoading ? (
                                <IonSpinner
                                    name="crescent"
                                    color="light"
                                    className="w-[20px] h-[20px]"
                                />
                            ) : (
                                <Plus className="text-white w-[25px] h-[25px] min-w-[25px] min-h-[25px]" />
                            )}
                        </button>
                    </div>
                    {errors.email && (
                        <p className="text-rose-500 text-sm w-full text-left mt-1 ml-2">
                            {errors.email}
                        </p>
                    )}
                </div>

                {emails?.length > 0 ? (
                    emails.map(emailItem => (
                        <UserEmailContactItem
                            key={emailItem?.id}
                            email={emailItem}
                            refetchContactMethods={refetchContactMethods}
                        />
                    ))
                ) : (
                    <section className="w-full flex flex-col items-center justify-center my-[30px]">
                        <FloatingBottleIcon />
                        <p className="font-poppins text-[17px] font-normal text-grayscale-900 mt-[10px]">
                            No emails added yet.
                        </p>
                    </section>
                )}
            </div>
        </div>
    );
};

export default UserEmailContacts;
