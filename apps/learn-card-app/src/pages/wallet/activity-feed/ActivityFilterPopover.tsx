import React, { useState } from 'react';
import { ACTIVITY_FILTERS, type ActivityFilterId } from './activityFeed.helpers';

type Props = {
    selected: ActivityFilterId;
    onApply: (id: ActivityFilterId) => void;
    onReset: () => void;
};

export const ActivityFilterPopover: React.FC<Props> = ({ selected, onApply, onReset }) => {
    const [draft, setDraft] = useState<ActivityFilterId>(selected);
    return (
        <div className="bg-white rounded-[18px] shadow-lg p-4 w-[300px] flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
                {ACTIVITY_FILTERS.map(({ id, label }) => (
                    <button
                        key={String(id)}
                        type="button"
                        onClick={() => setDraft(id)}
                        className={`px-3 py-1 rounded-full text-[13px] font-poppins border ${
                            draft === id
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'bg-white text-grayscale-800 border-grayscale-300'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => {
                        setDraft('all');
                        onReset();
                    }}
                    className="flex-1 py-2 rounded-full border border-grayscale-300 text-[14px] font-poppins"
                >
                    Reset
                </button>
                <button
                    type="button"
                    onClick={() => onApply(draft)}
                    className="flex-1 py-2 rounded-full bg-indigo-500 text-white text-[14px] font-poppins"
                >
                    Apply Filter
                </button>
            </div>
        </div>
    );
};

export default ActivityFilterPopover;
