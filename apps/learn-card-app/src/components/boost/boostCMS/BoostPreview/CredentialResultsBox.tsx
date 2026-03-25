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

    const itemCount = results.length + (hasCreditsEarned ? 1 : 0);

    return (
        <div className="bg-white flex flex-col items-start gap-[12px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
            <div className="w-full flex items-center justify-between gap-[8px]">
                <h3 className="text-[17px] text-grayscale-900 font-poppins">Results</h3>
                <span className="text-[11px] leading-[16px] font-semibold uppercase text-grayscale-600 bg-grayscale-100 rounded-[999px] px-[8px] py-[2px]">
                    {itemCount} item{itemCount === 1 ? '' : 's'}
                </span>
            </div>

            <div className="w-full flex flex-col gap-[10px]">
                {hasResults &&
                    results.map((result, index) => (
                        <div
                            key={`${result.name}-${result.value}-${index}`}
                            className="bg-grayscale-100 rounded-[14px] px-[12px] py-[10px] flex items-center justify-between gap-[12px] border border-grayscale-200"
                        >
                            <div className="min-w-0 flex flex-col gap-[3px]">
                                <p className="text-grayscale-900 text-[13px] font-semibold leading-[17px] truncate">
                                    {result.name}
                                </p>
                                {result.resultType && (
                                    <p className="text-grayscale-600 text-[10px] leading-[14px] font-semibold uppercase tracking-[0.4px]">
                                        {result.resultType}
                                    </p>
                                )}
                                {result.description && (
                                    <p className="text-grayscale-700 text-[11px] font-normal leading-[15px]">
                                        {result.description}
                                    </p>
                                )}
                            </div>
                            <p className="text-grayscale-900 text-[13px] font-bold shrink-0 bg-white rounded-[10px] px-[10px] py-[6px] border border-grayscale-200 shadow-sm">
                                {formatResultValue(result)}
                            </p>
                        </div>
                    ))}

                {hasCreditsEarned && (
                    <div className="bg-grayscale-100 rounded-[14px] px-[12px] py-[10px] flex items-center justify-between gap-[12px] border border-grayscale-200">
                        <p className="text-grayscale-900 text-[13px] font-semibold leading-[17px]">
                            Credits Earned
                        </p>
                        <p className="text-grayscale-900 text-[13px] font-bold shrink-0 bg-white rounded-[10px] px-[10px] py-[6px] border border-grayscale-200 shadow-sm">
                            {formatNumberValue(creditsEarned)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CredentialResultsBox;
