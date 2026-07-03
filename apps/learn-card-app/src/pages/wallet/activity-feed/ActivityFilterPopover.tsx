import React, { useState } from 'react';
import { CredentialCategoryEnum } from 'learn-card-base';
import { useTheme } from '../../../theme/hooks/useTheme';
import { ACTIVITY_FILTERS, type ActivityFilterId } from './activityFeed.helpers';

type Props = {
    selected: ActivityFilterId;
    onApply: (id: ActivityFilterId) => void;
    onReset: () => void;
};

export const ActivityFilterPopover: React.FC<Props> = ({ selected, onApply, onReset }) => {
    const { getThemedCategory } = useTheme();
    const [draft, setDraft] = useState<ActivityFilterId>(selected);
    // Apply is a no-op until the draft differs from what's already applied.
    const dirty = draft !== selected;

    return (
        <div className="w-[320px] flex flex-col gap-4 rounded-[24px] border border-grayscale-100 bg-white p-[18px] shadow-[0_12px_40px_rgba(24,34,78,0.18)]">
            <div className="flex flex-wrap gap-[10px]">
                {ACTIVITY_FILTERS.map(({ id, label }) => {
                    const isSelected = draft === id;
                    const themed =
                        id === 'all' ? null : getThemedCategory(id as CredentialCategoryEnum);
                    const Icon = themed?.icons?.Icon ?? themed?.icons?.IconWithShape;
                    return (
                        <button
                            key={String(id)}
                            type="button"
                            onClick={() => setDraft(id)}
                            className={`flex items-center gap-[6px] rounded-full border px-[14px] py-[8px] font-poppins text-[14px] font-medium transition-colors ${
                                isSelected
                                    ? 'border-[#1C2444] bg-[#1C2444] text-white'
                                    : 'border-grayscale-200 bg-white text-grayscale-800'
                            }`}
                        >
                            {Icon && <Icon className="h-[18px] w-[18px]" />}
                            {label}
                        </button>
                    );
                })}
            </div>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => {
                        setDraft('all');
                        onReset();
                    }}
                    className="flex-1 rounded-full py-[11px] font-poppins text-[15px] font-medium text-grayscale-600"
                >
                    Reset
                </button>
                <button
                    type="button"
                    disabled={!dirty}
                    onClick={() => onApply(draft)}
                    className={`flex-1 rounded-full py-[11px] font-poppins text-[15px] font-medium text-white transition-colors ${
                        dirty ? 'bg-[#1C2444]' : 'bg-grayscale-300'
                    }`}
                >
                    Apply Filter
                </button>
            </div>
        </div>
    );
};

export default ActivityFilterPopover;
