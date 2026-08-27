import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

export function ErrorState({
    message = 'Something went wrong. Please try again.',
    onRetry,
}: {
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <div className="text-center py-16 bg-card border border-destructive/20 rounded-xl">
            <AlertTriangle className="w-12 h-12 text-destructive/50 mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold text-foreground mb-2">Error</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">{message}</p>
            {onRetry && (
                <Button variant="outline" className="mt-4" onClick={onRetry}>
                    Try Again
                </Button>
            )}
        </div>
    );
}
