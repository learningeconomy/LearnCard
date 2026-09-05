import * as React from 'react';
import { cn } from '../../lib/utils';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, htmlFor, children }, ref) => (
        <label
            ref={ref}
            htmlFor={htmlFor}
            className={cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                className
            )}
        >
            {children}
        </label>
    )
);
Label.displayName = 'Label';

export { Label };
