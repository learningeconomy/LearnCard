import type { LucideIcon } from 'lucide-react';
import { Badge } from './ui/badge';

export type InstallTargetSummary = {
    id: string;
    intentId: string;
    status: string;
    createdAt: string;
    listingId?: string;
    displayName?: string;
    tagline?: string;
};

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'outline';

const statusVariant = (status: string): BadgeVariant => {
    if (status === 'READY') return 'success';
    if (status === 'FAILED') return 'destructive';
    if (status === 'DEGRADED' || status === 'SUSPENDED') return 'warning';

    return 'outline';
};

const formatCreatedAt = (createdAt: string): string => {
    const date = new Date(createdAt);

    return Number.isNaN(date.getTime()) ? createdAt : date.toLocaleDateString();
};

// Fallback for legacy targets without a persisted listingId: target ids are
// `target_<intentId>_<declarationId>` (brain getIntentTargetId), and the
// declarationId is the bundle manifest's own name for the member (ADR-008).
const displayTitle = (target: InstallTargetSummary): string => {
    if (target.displayName) return target.displayName;

    const declarationId = target.id.startsWith(`target_${target.intentId}_`)
        ? target.id.slice(`target_${target.intentId}_`.length)
        : null;

    if (!declarationId) return target.id;

    return declarationId
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

type InstallTargetListProps = {
    targets: InstallTargetSummary[];
    icon: LucideIcon;
    emptyMessage: string;
};

export function InstallTargetList({ targets, icon: Icon, emptyMessage }: InstallTargetListProps) {
    if (targets.length === 0) {
        return <div className="text-center py-12 text-muted-foreground">{emptyMessage}</div>;
    }

    return (
        <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
            {targets.map(target => (
                <div
                    key={target.id}
                    className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-card"
                >
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary shrink-0">
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-display font-bold text-foreground break-words">
                                {displayTitle(target)}
                            </h3>
                            {target.tagline && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {target.tagline}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                                <Badge
                                    variant={statusVariant(target.status)}
                                    className="text-[10px]"
                                >
                                    {target.status}
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">
                                    {formatCreatedAt(target.createdAt)}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-2 break-all">
                                {target.intentId}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
