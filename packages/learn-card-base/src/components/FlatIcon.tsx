import React from 'react';

export const FlatIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="[&_path]:!fill-current [&_path]:!stroke-none shrink-0">{children}</span>
);
