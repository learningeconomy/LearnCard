import { LucideIcon, Construction } from 'lucide-react';

interface ComingSoonProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
}

export function ComingSoon({
    title,
    description = 'This page is coming soon — it will be powered by a console-bff procedure.',
    icon: Icon = Construction,
}: ComingSoonProps) {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold">{title}</h1>
                <p className="text-muted-foreground">Manage your {title.toLowerCase()}.</p>
            </div>
            <div className="text-center py-16 bg-card border border-border rounded-xl">
                <Icon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
            </div>
        </div>
    );
}
