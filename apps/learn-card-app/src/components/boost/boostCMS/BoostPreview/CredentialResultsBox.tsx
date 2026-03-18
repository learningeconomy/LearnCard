import React from 'react';

type CredentialResultDisplay = {
    name: string;
    value: string;
    resultType?: string;
    description?: string;
};

type CredentialResultsBoxProps = {
    results?: CredentialResultDisplay[];
    creditsEarned?: string | number;
};

const isNumericValue = (value: string | number) => {
    const normalizedValue = String(value).trim().replace(/,/g, '');

    return normalizedValue !== '' && /^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(normalizedValue);
};

const getFractionDigits = (value: string) => {
    const normalizedValue = value.trim().replace(/,/g, '');
    const [, fractionPart = ''] = normalizedValue.split('.');

    return Math.min(20, fractionPart.length);
};

const isGpaResult = ({ name, resultType }: CredentialResultDisplay) =>
    /gpa/i.test(name) || resultType === 'GradePointAverage';

const formatNumberValue = (value: string | number, minimumFractionDigits = 0) => {
    if (!isNumericValue(value)) return String(value);

    const stringValue = String(value).trim();
    const numericValue = Number(stringValue.replace(/,/g, ''));
    const maximumFractionDigits = Math.max(minimumFractionDigits, getFractionDigits(stringValue));

    return numericValue.toLocaleString('en-US', {
        minimumFractionDigits,
        maximumFractionDigits,
    });
};

const formatResultValue = (result: CredentialResultDisplay) => {
    if (!result.value) return '-';

    if (!isNumericValue(result.value)) return result.value;

    return isGpaResult(result)
        ? formatNumberValue(result.value, 2)
        : formatNumberValue(result.value);
};

const CredentialResultsBox: React.FC<CredentialResultsBoxProps> = ({
    results = [],
    creditsEarned,
}) => {
    const hasResults = results.length > 0;
    const hasCreditsEarned = creditsEarned !== undefined && creditsEarned !== null;

    if (!hasResults && !hasCreditsEarned) return null;

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
            <h3 className="text-[17px] text-grayscale-900 font-poppins">Results</h3>

            <div className="w-full flex flex-col gap-[8px]">
                {hasResults &&
                    results.map((result, index) => (
                        <div
                            key={`${result.name}-${result.value}-${index}`}
                            className="bg-grayscale-100 rounded-[12px] px-[10px] py-[8px] flex items-center justify-between gap-[10px]"
                        >
                            <div className="min-w-0">
                                <p className="text-grayscale-900 text-[13px] font-semibold truncate">
                                    {result.name}
                                </p>
                                {result.resultType && (
                                    <p className="text-grayscale-600 text-[11px] font-medium">
                                        {result.resultType}
                                    </p>
                                )}
                                {result.description && (
                                    <p className="text-grayscale-700 text-[11px] font-normal leading-[15px] mt-[2px]">
                                        {result.description}
                                    </p>
                                )}
                            </div>
                            <p className="text-grayscale-900 text-[13px] font-semibold shrink-0">
                                {formatResultValue(result)}
                            </p>
                        </div>
                    ))}

                {hasCreditsEarned && (
                    <div className="bg-grayscale-100 rounded-[12px] px-[10px] py-[8px] flex items-center justify-between gap-[10px]">
                        <p className="text-grayscale-900 text-[13px] font-semibold">
                            Credits Earned
                        </p>
                        <p className="text-grayscale-900 text-[13px] font-semibold shrink-0">
                            {formatNumberValue(creditsEarned)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CredentialResultsBox;
