import React from 'react';

import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

import { SkillCompetencyCard } from '@learncard/react';
import { useGetSkillFrameworkById } from 'learn-card-base';

type Alignment = {
    targetUrl: string;
    targetName: string;
    targetFramework: string;
    targetCode?: string;
    targetDescription?: string;
};

const ensureAbsoluteUrl = (raw?: string): string | undefined => {
    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;

    return `https://${raw}`;
};

const SkillCompetencyAlignmentCard: React.FC<{ alignment: Alignment }> = ({ alignment }) => {
    const { data: frameworkData } = useGetSkillFrameworkById(alignment.targetFramework);

    const sourceUrl = ensureAbsoluteUrl(alignment.targetUrl);
    const frameworkName = frameworkData?.framework?.name ?? alignment.targetFramework;
    const name = alignment.targetName || alignment.targetCode || 'Skill or competency';

    const handleOpenSource = async (): Promise<void> => {
        if (!sourceUrl) return;

        if (Capacitor.isNativePlatform()) {
            await Browser.open({ url: sourceUrl });
        } else {
            window.open(sourceUrl, '_blank');
        }
    };

    return (
        <SkillCompetencyCard
            name={name}
            frameworkName={frameworkName}
            code={alignment.targetCode}
            description={alignment.targetDescription}
            sourceUrl={sourceUrl}
            onOpenSource={handleOpenSource}
        />
    );
};

export default SkillCompetencyAlignmentCard;
