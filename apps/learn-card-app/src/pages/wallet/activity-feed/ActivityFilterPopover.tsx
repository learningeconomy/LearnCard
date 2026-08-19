import React, { useState } from 'react';
import { CredentialCategoryEnum } from 'learn-card-base';
import { useTheme } from '../../../theme/hooks/useTheme';
import { getActivityFilters, type ActivityFilterId } from './activityFeed.helpers';
import * as m from '../../../paraglide/messages.js';

type Props = {
    id?: string;
    selected: ActivityFilterId;
    onApply: (id: ActivityFilterId) => void;
    onReset: () => void;
};

export const ActivityFilterPopover: React.FC<Props> = ({ id, selected, onApply, onReset }) => {
    const { getThemedCategory } = useTheme();
    const [draft, setDraft] = useState<ActivityFilterId>(selected);
    // Apply is a no-op until the draft differs from what's already applied.
    const dirty = draft !== selected;
    // Recomputed each render so labels track the active locale.
    const filters = getActivityFilters();

    return (
        <div
            id={id}
            role="dialog"
            aria-label={m['passport.activity.filter']()}
            className="w-[320px] flex flex-col gap-4 rounded-[24px] border border-grayscale-100 bg-white p-[18px] shadow-[0_12px_40px_rgba(24,34,78,0.18)]"
        >
            <div className="flex flex-wrap gap-[10px]">
                {filters.map(({ id: filterId, label }) => {
                    const isSelected = draft === filterId;
                    const themed =
                        filterId === 'all'
                            ? null
                            : getThemedCategory(filterId as CredentialCategoryEnum);
                    const Icon = themed?.icons?.Icon ?? themed?.icons?.IconWithShape;
                    return (
                        <button
                            key={String(filterId)}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setDraft(filterId)}
                            className={`flex items-center gap-[6px] rounded-full border px-[14px] py-[8px] font-poppins text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
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
                    className="flex-1 rounded-full py-[11px] font-poppins text-[15px] font-medium text-grayscale-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    {m['passport.activity.reset']()}
                </button>
                <button
                    type="button"
                    disabled={!dirty}
                    onClick={() => onApply(draft)}
                    className={`flex-1 rounded-full py-[11px] font-poppins text-[15px] font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        dirty ? 'bg-[#1C2444]' : 'bg-grayscale-300'
                    }`}
                >
                    {m['passport.activity.applyFilter']()}
                </button>
            </div>
        </div>
    );
};

export default ActivityFilterPopover;
