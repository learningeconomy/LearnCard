import type React from 'react';

import { formatClrDate } from 'learn-card-base/helpers/credentials/clr/renderer';
import type { SourceMappedField } from 'learn-card-base/helpers/credentials/clr/renderer';

type Props<T> = {
    label: string;
    field?: SourceMappedField<T>;
    showSource?: boolean;
};

const ClrTranscriptSourceField = <T,>({
    label,
    field,
    showSource = false,
}: Props<T>): React.ReactElement | null => {
    if (!field) return null;

    const stringifyValue: (value: unknown) => string = (value: unknown): string => {
        if (typeof value === 'string') return formatClrDate(value);
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return JSON.stringify(value);
    };

    return (
        <div className="space-y-1">
            <p className="text-xs font-medium text-grayscale-700">{label}</p>
            <p className="text-sm text-grayscale-900 leading-relaxed">
                {stringifyValue(field.value)}
            </p>
            {showSource && (
                <p className="text-xs text-grayscale-500 leading-relaxed">
                    {field.specField} • {field.sourcePath}
                </p>
            )}
        </div>
    );
};

export default ClrTranscriptSourceField;
