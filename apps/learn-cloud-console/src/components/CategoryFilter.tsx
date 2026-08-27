import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CategoryFilterProps {
    categories: string[];
    activeCategory: string | null;
    onCategoryChange: (cat: string | null) => void;
    allCount: number;
    getCategoryCount: (cat: string) => number;
}

export function CategoryFilter({
    categories,
    activeCategory,
    onCategoryChange,
    allCount,
    getCategoryCount,
}: CategoryFilterProps) {
    const [expanded, setExpanded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const allButtons = [
        <Button
            key="__all"
            variant={!activeCategory ? 'hero' : 'outline'}
            size="sm"
            className="shrink-0 whitespace-nowrap"
            onClick={() => onCategoryChange(null)}
        >
            All ({allCount})
        </Button>,
        ...categories.map(cat => (
            <Button
                key={cat}
                variant={activeCategory === cat ? 'hero' : 'outline'}
                size="sm"
                className="shrink-0 whitespace-nowrap"
                onClick={() => onCategoryChange(activeCategory === cat ? null : cat)}
            >
                {cat} ({getCategoryCount(cat)})
            </Button>
        )),
    ];

    return (
        <>
            {/* Mobile: horizontal scroll, single row */}
            <div
                ref={scrollRef}
                className="flex md:hidden gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {allButtons}
            </div>

            {/* Desktop: single row with overflow hidden + "Show more" */}
            <div className="hidden md:block">
                <div
                    className={`flex gap-1.5 ${
                        expanded ? 'flex-wrap' : 'overflow-hidden max-h-[36px]'
                    }`}
                >
                    {allButtons}
                </div>
                {categories.length > 4 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1.5 text-xs text-muted-foreground h-7 px-2"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? (
                            <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                Show less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                Show more
                            </>
                        )}
                    </Button>
                )}
            </div>
        </>
    );
}
