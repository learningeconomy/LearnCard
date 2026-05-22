import React from 'react';

type ChecklistItem = {
    key: string;
    label: string;
    done: boolean;
    onClick: () => void;
};

type GetStartedChecklistProps = {
    items: ChecklistItem[];
    onDismiss: () => void;
};

const GetStartedChecklist: React.FC<GetStartedChecklistProps> = ({ items, onDismiss }) => {
    const completed = items.filter(i => i.done).length;
    const total = items.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <section className="bg-white rounded-[20px] p-5 shadow-soft-bottom border border-grayscale-200 animate-fade-in-up">
            <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium tracking-wider text-grayscale-500 uppercase">
                        Get started
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-grayscale-900 leading-tight">
                        Make LearnCard yours in 3 steps
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss"
                    className="shrink-0 w-7 h-7 rounded-full hover:bg-grayscale-100 transition-colors flex items-center justify-center text-grayscale-500 hover:text-grayscale-700"
                >
                    ×
                </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-1.5 bg-grayscale-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-grayscale-900 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <span className="text-xs text-grayscale-600 font-medium">
                    {completed} of {total}
                </span>
            </div>

            <ul className="flex flex-col gap-2">
                {items.map(item => (
                    <li key={item.key}>
                        <button
                            type="button"
                            onClick={item.onClick}
                            disabled={item.done}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${
                                item.done
                                    ? 'bg-emerald-50 cursor-default'
                                    : 'bg-grayscale-100 hover:bg-grayscale-200'
                            }`}
                        >
                            <span
                                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                    item.done
                                        ? 'bg-emerald-600 text-white'
                                        : 'border-2 border-grayscale-300 bg-white'
                                }`}
                            >
                                {item.done ? '✓' : ''}
                            </span>
                            <span
                                className={`flex-1 text-sm font-medium ${
                                    item.done
                                        ? 'text-grayscale-500 line-through'
                                        : 'text-grayscale-900'
                                }`}
                            >
                                {item.label}
                            </span>
                            {!item.done && (
                                <span className="text-grayscale-400 text-lg leading-none">›</span>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default GetStartedChecklist;
