import React from 'react';

type CredentialListSkeletonProps = {
    className?: string;
    count?: number;
    viewMode?: 'card' | 'list';
};

const CARD_GRID_STYLE: React.CSSProperties = {
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
};

const CardSkeleton: React.FC = () => (
    <div className="w-full max-w-[280px] overflow-hidden rounded-[20px] bg-white p-4 shadow-sm">
        <div className="mx-auto mb-4 h-28 w-28 rounded-full bg-grayscale-200" />
        <div className="mx-auto mb-2 h-5 w-3/4 rounded-md bg-grayscale-200" />
        <div className="mx-auto mb-5 h-3 w-1/2 rounded-md bg-grayscale-100" />
        <div className="mb-2 h-3 w-full rounded-md bg-grayscale-100" />
        <div className="mb-5 h-3 w-4/5 rounded-md bg-grayscale-100" />
        <div className="h-10 w-full rounded-[20px] bg-grayscale-200" />
    </div>
);

const ListSkeleton: React.FC = () => (
    <div className="flex w-full items-center gap-4 rounded-[20px] bg-white p-4 shadow-sm">
        <div className="h-16 w-16 shrink-0 rounded-2xl bg-grayscale-200" />
        <div className="min-w-0 flex-1">
            <div className="mb-2 h-4 w-3/4 rounded-md bg-grayscale-200" />
            <div className="mb-2 h-3 w-1/2 rounded-md bg-grayscale-100" />
            <div className="h-3 w-2/3 rounded-md bg-grayscale-100" />
        </div>
        <div className="h-8 w-8 shrink-0 rounded-full bg-grayscale-100" />
    </div>
);

export const CredentialListSkeleton: React.FC<CredentialListSkeletonProps> = ({
    className = '',
    count = 4,
    viewMode = 'card',
}) => {
    const isCardView = viewMode === 'card';

    return (
        <section
            className={`w-full animate-pulse px-4 py-6 ${className}`}
            role="status"
            aria-label="Loading credentials"
        >
            <div
                className={
                    isCardView
                        ? 'mx-auto grid max-w-[600px] justify-items-center gap-4'
                        : 'mx-auto flex max-w-[600px] flex-col gap-3'
                }
                style={isCardView ? CARD_GRID_STYLE : undefined}
            >
                {Array.from({ length: count }, (_, index) =>
                    isCardView ? <CardSkeleton key={`${viewMode}-skeleton-${index}`} /> : <ListSkeleton key={`${viewMode}-skeleton-${index}`} />
                )}
            </div>
        </section>
    );
};
