export function PageSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
                <div className="h-9 w-48 bg-muted animate-pulse rounded-md" />
                <div className="h-5 w-80 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-card border border-border rounded-xl p-4 h-20 animate-pulse"
                    />
                ))}
            </div>
        </div>
    );
}
