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
    variant?: 'default' | 'hero';
    primaryButtonClass?: string;
};

const DEFAULT_PRIMARY_BUTTON = 'bg-grayscale-900 text-white';

const GetStartedChecklist: React.FC<GetStartedChecklistProps> = ({
    items,
    onDismiss,
    variant = 'default',
    primaryButtonClass = DEFAULT_PRIMARY_BUTTON,
}) => {
    const completed = items.filter(i => i.done).length;
    const total = items.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const nextItem = items.find(i => !i.done) ?? null;

    if (variant === 'hero') {
        return (
            <section className="relative overflow-hidden rounded-[20px] p-6 desktop:p-8 bg-gradient-to-br from-grayscale-900 via-grayscale-800 to-grayscale-900 text-white shadow-soft-bottom animate-fade-in-up">
                <span
                    aria-hidden
                    className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-indigo-500/25 blur-2xl"
                />
                <span
                    aria-hidden
                    className="absolute -bottom-20 -left-12 w-64 h-64 rounded-full bg-indigo-400/10 blur-2xl"
                />

                <div className="relative flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium tracking-[0.14em] text-indigo-200/90 uppercase">
                            Get started
                        </p>
                        <h2 className="mt-1 text-2xl desktop:text-3xl font-semibold leading-tight">
                            Make LearnCard yours
                        </h2>
                        <p className="mt-1 text-sm text-white/75 leading-relaxed">
                            Three quick steps to set up your passport.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onDismiss}
                        aria-label="Dismiss"
                        className="shrink-0 w-8 h-8 rounded-full hover:bg-white/15 transition-colors flex items-center justify-center text-white/70 hover:text-white text-lg leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="relative flex items-center gap-3 mb-5">
                    <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <span className="text-xs text-white/75 font-medium">
                        {completed} of {total}
                    </span>
                </div>

                <ul className="relative flex flex-col gap-2 mb-5">
                    {items.map(item => (
                        <li key={item.key}>
                            <button
                                type="button"
                                onClick={item.onClick}
                                disabled={item.done}
                                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${
                                    item.done
                                        ? 'bg-white/[0.06] cursor-default'
                                        : 'bg-white/10 hover:bg-white/20 active:scale-[0.99]'
                                }`}
                            >
                                <span
                                    className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                        item.done
                                            ? 'bg-indigo-400 text-grayscale-900'
                                            : 'border-2 border-white/60 bg-transparent'
                                    }`}
                                >
                                    {item.done ? '✓' : ''}
                                </span>
                                <span
                                    className={`flex-1 text-sm font-medium ${
                                        item.done ? 'text-white/50' : 'text-white'
                                    }`}
                                >
                                    {item.label}
                                </span>
                                {!item.done && (
                                    <span className="text-white/70 text-lg leading-none">
                                        ›
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>

                {nextItem && (
                    <button
                        type="button"
                        onClick={nextItem.onClick}
                        className={`relative w-full py-3 px-4 rounded-[20px] font-semibold text-sm hover:opacity-90 transition-opacity active:scale-[0.99] ${primaryButtonClass}`}
                    >
                        {nextItem.label}
                    </button>
                )}
            </section>
        );
    }

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
                                    item.done ? 'text-grayscale-400' : 'text-grayscale-900'
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
