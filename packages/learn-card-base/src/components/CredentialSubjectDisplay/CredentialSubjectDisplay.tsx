import React from 'react';
import { ellipsisMiddle, splitAtCapitalLetters } from 'learn-card-base/helpers/stringHelpers';

export const CredentialSubjectDisplay: React.FC<{ credentialSubject: any }> = ({
    credentialSubject,
}) => {
    // mapped OBJ {} -> []
    const CredentialSubjectFieldKeys = Object.keys(credentialSubject);

    // map over all credentialSubject fields
    const subjectFields = CredentialSubjectFieldKeys.map((fieldKey, i) => {
        // check if a given field is an array
        if (Array.isArray(credentialSubject[fieldKey])) {
            const fields = credentialSubject[fieldKey];
            const fieldItems = fields.map((field, i2) => {
                const _i2 = i2 + 1;

                return (
                    <p
                        key={field}
                        className="text-[12px] text-grayscale-700 leading-[18px] font-poppins font-[400] mb-0"
                    >
                        <span className="input-label">
                            <strong className="capitalize">
                                {splitAtCapitalLetters(fieldKey)} {_i2}:{' '}
                            </strong>
                            {field}
                        </span>
                    </p>
                );
            });
            return fieldItems;
        }

        // format DID key
        if (fieldKey === 'id') {
            return (
                <p
                    key={i}
                    className="text-[12px] text-grayscale-700 leading-[18px] font-poppins font-[400] mb-0"
                >
                    <span className="input-label">
                        <strong className="uppercase">{splitAtCapitalLetters(fieldKey)}: </strong>{' '}
                        {ellipsisMiddle(credentialSubject[fieldKey], 8, 6)}
                    </span>
                </p>
            );
        }

        // omit image field
        if (fieldKey === 'image') return <></>;

        return (
            <p
                key={fieldKey}
                className="text-[12px] text-grayscale-700 leading-[18px] font-poppins font-[400] mb-0"
            >
                <span className="">
                    <strong className="capitalize">{splitAtCapitalLetters(fieldKey)}: </strong>
                    {credentialSubject[fieldKey]}
                </span>
            </p>
        );
    });

    if (subjectFields.length > 0) return subjectFields;

    return <></>;
};

export default CredentialSubjectDisplay;
