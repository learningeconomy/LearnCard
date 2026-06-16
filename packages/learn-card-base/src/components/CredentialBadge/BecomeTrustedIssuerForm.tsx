import React from 'react';

import { Widget } from '@typeform/embed-react';
import X from '../../svgs/X';

import { useGetCurrentLCNUser } from '../../hooks/useGetCurrentLCNUser';
import { useGetDid } from '../../react-query/queries/queries';
import useModal from '../modals/useModal';

// "Become a Trusted Issuer" intake form
const TYPEFORM_ID = 'BI7N9t60';

export type BecomeTrustedIssuerFormProps = {
    onSubmit?: () => void;
    className?: string;
    issuerDid?: string;
};

/**
 * Renders the "Become a Trusted Issuer" Typeform with the current user's DID,
 * profile id, and display name prefilled into the form's hidden fields
 * (`did`, `profile_id`, `name`).
 */
export const BecomeTrustedIssuerForm: React.FC<BecomeTrustedIssuerFormProps> = ({
    onSubmit,
    issuerDid,
}) => {
    const { closeModal } = useModal();

    const { data: did } = useGetDid();
    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();

    // Wait until we have the values so the form isn't rendered without prefill.
    if (currentLCNUserLoading || !did) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white overflow-hidden shadow-md px-6 py-5 shrink-0 safe-area-top-margin">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-[22px] text-grayscale-900 leading-tight font-semibold">
                        Become a Trusted Issuer
                    </p>
                    <button
                        onClick={closeModal}
                        aria-label="Close"
                        className="shrink-0 w-[50px] h-[50px] flex items-center justify-center rounded-full text-grayscale-600 bg-white border-solid border-grayscale-100 border-[2px]"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
            <Widget
                id={TYPEFORM_ID}
                className="w-full flex-1"
                hidden={{
                    did,
                    profile_id: currentLCNUser?.profileId ?? '',
                    name: currentLCNUser?.displayName ?? '',
                    issuer_did: issuerDid ?? '',
                }}
                onSubmit={onSubmit}
                inlineOnMobile
            />
        </div>
    );
};

export default BecomeTrustedIssuerForm;
