import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'relative h-4 w-full overflow-hidden rounded-full bg-primary/10',
                className
            )}
            {...props}
        >
            <div
                className="h-full w-full flex-1 bg-secondary transition-all"
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            />
        </div>
    )
);
Progress.displayName = 'Progress';

export { Progress };
