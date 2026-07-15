import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';

type BirthdayPickerProps = {
    value: string;
    onChange: (iso: string) => void;
    className?: string;
};

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const SPACER_COUNT = Math.floor(VISIBLE_ITEMS / 2);

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const BirthdayPicker: React.FC<BirthdayPickerProps> = ({ value, onChange, className = '' }) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const [hasInteracted, setHasInteracted] = useState(() => Boolean(value));

    const initialDate = useMemo(() => {
        if (value) {
            const [y, m, d] = value.split('-').map(Number);
            if (y && m && d) {
                return { year: y, month: m, day: d };
            }
        }
        return { year: currentYear - 18, month: 1, day: 1 };
    }, []);

    const [selectedYear, setSelectedYear] = useState(initialDate.year);
    const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
    const [selectedDay, setSelectedDay] = useState(initialDate.day);

    const years = useMemo(() => {
        const arr = [];
        for (let y = 1900; y <= currentYear; y++) {
            arr.push(y);
        }
        return arr;
    }, [currentYear]);

    const months = useMemo(() => {
        const maxMonth = selectedYear === currentYear ? currentMonth : 12;
        const arr = [];
        for (let m = 1; m <= maxMonth; m++) {
            arr.push(m);
        }
        return arr;
    }, [selectedYear, currentYear, currentMonth]);

    const days = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const maxDay =
            selectedYear === currentYear && selectedMonth === currentMonth
                ? Math.min(currentDay, daysInMonth)
                : daysInMonth;

        const arr = [];
        for (let d = 1; d <= maxDay; d++) {
            arr.push(d);
        }
        return arr;
    }, [selectedYear, selectedMonth, currentYear, currentMonth, currentDay]);

    useEffect(() => {
        let changed = false;
        let newMonth = selectedMonth;
        let newDay = selectedDay;

        if (selectedMonth > months.length) {
            newMonth = months.length;
            changed = true;
        }

        const daysInNewMonth = new Date(selectedYear, newMonth, 0).getDate();
        const maxDay =
            selectedYear === currentYear && newMonth === currentMonth
                ? Math.min(currentDay, daysInNewMonth)
                : daysInNewMonth;

        if (newDay > maxDay) {
            newDay = maxDay;
            changed = true;
        }

        if (changed) {
            setSelectedMonth(newMonth);
            setSelectedDay(newDay);
        }
    }, [selectedYear, selectedMonth, months.length, currentYear, currentMonth, currentDay]);

    useEffect(() => {
        if (!hasInteracted) {
            if (value !== '') onChange('');
            return;
        }
        const y = selectedYear.toString();
        const m = selectedMonth.toString().padStart(2, '0');
        const d = selectedDay.toString().padStart(2, '0');
        const iso = `${y}-${m}-${d}`;
        if (iso !== value) {
            onChange(iso);
        }
    }, [selectedYear, selectedMonth, selectedDay, hasInteracted, value, onChange]);

    const monthRef = useRef<HTMLDivElement>(null);
    const dayRef = useRef<HTMLDivElement>(null);
    const yearRef = useRef<HTMLDivElement>(null);

    const isProgrammaticScroll = useRef({ month: false, day: false, year: false });
    const scrollTimeouts = useRef({ month: 0, day: 0, year: 0 });

    useLayoutEffect(() => {
        const setInitialScroll = (ref: React.RefObject<HTMLDivElement>, index: number) => {
            if (ref.current && index >= 0) {
                ref.current.scrollTop = index * ITEM_HEIGHT;
            }
        };

        setInitialScroll(monthRef, months.indexOf(selectedMonth));
        setInitialScroll(dayRef, days.indexOf(selectedDay));
        setInitialScroll(yearRef, years.indexOf(selectedYear));
    }, []);

    const handleScroll = useCallback(
        (
            type: 'month' | 'day' | 'year',
            ref: React.RefObject<HTMLDivElement>,
            options: number[],
            currentVal: number,
            setter: (val: number) => void
        ) => {
            if (!hasInteracted) {
                setHasInteracted(true);
            }

            if (scrollTimeouts.current[type]) {
                window.clearTimeout(scrollTimeouts.current[type]);
            }

            scrollTimeouts.current[type] = window.setTimeout(() => {
                if (!ref.current) return;

                const scrollTop = ref.current.scrollTop;
                let index = Math.round(scrollTop / ITEM_HEIGHT);
                index = Math.max(0, Math.min(index, options.length - 1));

                const newVal = options[index];
                if (newVal !== undefined && newVal !== currentVal) {
                    setter(newVal);
                }

                const targetScroll = index * ITEM_HEIGHT;
                if (Math.abs(scrollTop - targetScroll) > 1) {
                    isProgrammaticScroll.current[type] = true;
                    ref.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
                    setTimeout(() => {
                        isProgrammaticScroll.current[type] = false;
                    }, 300);
                }
            }, 120);
        },
        [hasInteracted]
    );

    useEffect(() => {
        const syncScroll = (
            type: 'month' | 'day' | 'year',
            ref: React.RefObject<HTMLDivElement>,
            index: number
        ) => {
            if (ref.current && index >= 0) {
                const targetScroll = index * ITEM_HEIGHT;
                if (Math.abs(ref.current.scrollTop - targetScroll) > 1) {
                    isProgrammaticScroll.current[type] = true;
                    ref.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
                    setTimeout(() => {
                        isProgrammaticScroll.current[type] = false;
                    }, 300);
                }
            }
        };

        syncScroll('month', monthRef, months.indexOf(selectedMonth));
        syncScroll('day', dayRef, days.indexOf(selectedDay));
        syncScroll('year', yearRef, years.indexOf(selectedYear));
    }, [selectedMonth, selectedDay, selectedYear, months, days, years]);

    const handleItemClick = (
        type: 'month' | 'day' | 'year',
        ref: React.RefObject<HTMLDivElement>,
        index: number,
        val: number,
        setter: (val: number) => void
    ) => {
        if (!hasInteracted) setHasInteracted(true);
        setter(val);
        if (ref.current) {
            isProgrammaticScroll.current[type] = true;
            ref.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
            setTimeout(() => {
                isProgrammaticScroll.current[type] = false;
            }, 300);
        }
    };

    const handleKeyDown = (
        type: 'month' | 'day' | 'year',
        ref: React.RefObject<HTMLDivElement>,
        options: number[],
        currentVal: number,
        setter: (val: number) => void,
        e: React.KeyboardEvent
    ) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        if (!hasInteracted) setHasInteracted(true);

        const currentIndex = options.indexOf(currentVal);
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = Math.max(0, Math.min(options.length - 1, currentIndex + delta));
        const nextVal = options[nextIndex];
        if (nextVal === undefined || nextVal === currentVal) return;

        setter(nextVal);
        if (ref.current) {
            isProgrammaticScroll.current[type] = true;
            ref.current.scrollTo({ top: nextIndex * ITEM_HEIGHT, behavior: 'smooth' });
            setTimeout(() => {
                isProgrammaticScroll.current[type] = false;
            }, 300);
        }
    };

    const renderColumn = (
        type: 'month' | 'day' | 'year',
        ref: React.RefObject<HTMLDivElement>,
        options: number[],
        selectedVal: number,
        setter: (val: number) => void,
        format: (val: number) => string
    ) => {
        return (
            <div
                ref={ref}
                role="listbox"
                aria-label={type.charAt(0).toUpperCase() + type.slice(1)}
                tabIndex={0}
                className="flex-1 h-[200px] overflow-y-auto snap-y snap-mandatory relative z-10 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 [&::-webkit-scrollbar]:hidden"
                style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
                onScroll={() => {
                    if (isProgrammaticScroll.current[type]) return;
                    handleScroll(type, ref, options, selectedVal, setter);
                }}
                onKeyDown={e => handleKeyDown(type, ref, options, selectedVal, setter, e)}
            >
                {Array.from({ length: SPACER_COUNT }).map((_, i) => (
                    <div key={`start-${i}`} style={{ height: ITEM_HEIGHT }} />
                ))}
                {options.map((opt, index) => {
                    const isSelected = opt === selectedVal;
                    return (
                        <div
                            key={opt}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleItemClick(type, ref, index, opt, setter)}
                            className={`flex items-center justify-center snap-center cursor-pointer tabular-nums transition-all duration-200 ${
                                isSelected
                                    ? 'text-emerald-700 font-semibold text-lg scale-100 opacity-100'
                                    : 'text-grayscale-400 text-base scale-95 opacity-60 hover:opacity-80'
                            }`}
                            style={{ height: ITEM_HEIGHT }}
                        >
                            {format(opt)}
                        </div>
                    );
                })}
                {Array.from({ length: SPACER_COUNT }).map((_, i) => (
                    <div key={`end-${i}`} style={{ height: ITEM_HEIGHT }} />
                ))}
            </div>
        );
    };

    return (
        <div
            role="group"
            aria-label="Date of birth"
            className={`flex flex-col items-center w-full font-poppins ${className}`}
        >
            {!hasInteracted && (
                <p className="text-xs text-grayscale-500 mb-2 animate-fade-in-up">
                    Scroll to choose
                </p>
            )}
            <div className="relative w-full bg-white/80 backdrop-blur-sm border border-grayscale-200/60 rounded-2xl shadow-sm p-2 overflow-hidden">
                <div className="absolute top-1/2 left-2 right-2 -translate-y-1/2 h-[40px] bg-emerald-50/60 rounded-xl border-y border-grayscale-200/70 pointer-events-none z-0" />

                <div
                    className="flex w-full relative z-10"
                    style={{
                        maskImage:
                            'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
                        WebkitMaskImage:
                            'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
                    }}
                >
                    {renderColumn(
                        'month',
                        monthRef,
                        months,
                        selectedMonth,
                        setSelectedMonth,
                        m => MONTHS[m - 1] || ''
                    )}
                    {renderColumn('day', dayRef, days, selectedDay, setSelectedDay, d =>
                        d.toString()
                    )}
                    {renderColumn('year', yearRef, years, selectedYear, setSelectedYear, y =>
                        y.toString()
                    )}
                </div>
            </div>
        </div>
    );
};

export default BirthdayPicker;
