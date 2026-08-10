import React, { useState, useEffect } from 'react';
import { z } from 'zod';

import Plus from '../../svgs/Plus';
import { IonSpinner } from '@ionic/react';
import UserEmailContactItem from './UserEmailContactItem';

import { EMAIL_REGEX, useGetMyContactMethods, useAddContactMethod } from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';
import * as m from '../../../paraglide/messages.js';
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
        <div className="w-full h-full flex flex-col px-2">
            <div className="shrink-0 bg-white pt-2 pb-3">
                <div className="w-full flex flex-col flex-1 items-center justify-between mb-2">
                    <div className="w-full flex items-center justify-center">
                        <div className="w-full flex items-center justify-start">
                            <label htmlFor="contact-email" className="sr-only">
                                {m['profile.emailAddress']()}
                            </label>
                            <input
                                id="contact-email"
                                autoCapitalize="on"
                                className={`w-full bg-grayscale-100 text-grayscale-900 placeholder:text-grayscale-400 rounded-[15px] px-4 py-3 font-medium tracking-widest text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent ${
                                    errors.email ? 'border-rose-500 border-[1px] border-solid' : ''
                                }`}
                                onChange={event => {
                                    setEmail(event.target.value);
                                    setErrors({});
                                }}
                                value={email ?? ''}
                                placeholder={m['profile.email.placeholder']()}
                                type="email"
                                autoComplete="email"
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={errors.email ? 'contact-email-error' : undefined}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => handleAddContactMethod()}
                            aria-label={`${m['common.add']()} ${m['profile.emailAddress']()}`}
                            aria-busy={addContactMethodLoading}
                            className={`bg-${primaryColor} rounded-full p-2 ml-4 w-[50px] h-[50px] min-w-[50px] min-h-[50px] flex items-center justify-center`}
                            disabled={addContactMethodLoading}
                        >
                            {addContactMethodLoading ? (
                                <IonSpinner
                                    name="crescent"
                                    color="light"
                                    className="w-[20px] h-[20px]"
                                    aria-hidden="true"
                                />
                            ) : (
                                <span aria-hidden="true">
                                    <Plus className="text-white w-[25px] h-[25px] min-w-[25px] min-h-[25px]" />
                                </span>
                            )}
                        </button>
                    </div>
                    {errors.email && (
                        <p
                            id="contact-email-error"
                            role="alert"
                            className="text-red-700 text-sm w-full text-left mt-1 ml-2"
                        >
                            {errors.email}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pb-6 flex flex-col gap-2">
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
                        <span aria-hidden="true">
                            <FloatingBottleIcon />
                        </span>
                        <p className="font-poppins text-[17px] font-normal text-grayscale-900 mt-[10px]">
                            {m['profile.email.noEmails']()}
                        </p>
                    </section>
                )}
            </div>
        </div>
    );
};

export default UserEmailContacts;
