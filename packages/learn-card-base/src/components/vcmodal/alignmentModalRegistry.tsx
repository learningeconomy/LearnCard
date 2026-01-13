import React from 'react';

export type AlignmentModalProps = {
    frameworkId?: string;
    skillId?: string;
    alignment?: any;
};

let AlignmentModalComponent: React.ComponentType<AlignmentModalProps> | null = null;

export const setAlignmentModalComponent = (component: React.ComponentType<AlignmentModalProps>) => {
    AlignmentModalComponent = component;
};

export const getAlignmentModalComponent = () => AlignmentModalComponent;
