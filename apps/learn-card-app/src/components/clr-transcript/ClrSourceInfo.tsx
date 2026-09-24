import React from 'react';
import { Info } from 'lucide-react';

import type { SourceMappedField } from '../../helpers/clrRenderer.helpers';

const ClrSourceInfo: React.FC<{
    field?: SourceMappedField<unknown>;
    label: string;
}> = ({ field, label }) => {
    if (!field) return null;

    return (
        <details className="relative shrink-0">
            <summary
                className="flex h-5 w-5 cursor-pointer list-none items-center justify-center rounded-full text-grayscale-400 hover:bg-grayscale-100 hover:text-grayscale-700"
                aria-label={`Show ${label} source`}
            >
                <Info className="h-3.5 w-3.5" />
            </summary>
            <div className="absolute right-0 z-10 mt-1 w-64 rounded-xl border border-grayscale-200 bg-white p-3 shadow-lg">
                <p className="text-xs font-medium text-grayscale-700">{field.specField}</p>
                <p className="mt-1 break-all font-mono text-[11px] text-grayscale-500">
                    {field.sourcePath}
                </p>
            </div>
        </details>
    );
};

export default ClrSourceInfo;
