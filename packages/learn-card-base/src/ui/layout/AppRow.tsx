import React from 'react';

export type AppRowProps = React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
};

/** App-owned replacement for `IonRow`: a wrapping flex row. */
export const AppRow: React.FC<AppRowProps> = ({ className, ...rest }) => (
    <div className={className ? `app-row ${className}` : 'app-row'} {...rest} />
);

export default AppRow;
