import React from 'react';

export type VCDisplayCardProps = {
    title?: string;
    createdAt?: string;
    issuerImage?: string;
    userImage?: string;
    className?: string;
    onClick?: () => void;
};

export const VCDisplayCard: React.FC<VCDisplayCardProps> = ({
    title,
    createdAt,
    issuerImage,
    userImage,
    className = '',
    onClick = () => {},
}) => {
    return <section>VC Display Card Props</section>;
};
