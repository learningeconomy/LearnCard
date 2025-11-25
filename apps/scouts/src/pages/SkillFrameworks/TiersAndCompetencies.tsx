import React from 'react';
import TierRow from './TierRow';
import CompetencyRow from './CompetencyRow';
import { SetState } from 'packages/shared-types/dist';
import {
    FrameworkNodeRole,
    SkillFramework,
    SkillFrameworkNode,
} from 'apps/scouts/src/components/boost/boost';

type TiersAndCompetenciesProps = {
    nodes: SkillFrameworkNode[];
    setSelectedNode: SetState<SkillFrameworkNode | null>;
    framework: SkillFramework;
};

const TiersAndCompetencies: React.FC<TiersAndCompetenciesProps> = ({
    nodes,
    setSelectedNode,
    framework,
}) => {
    nodes.sort((a, b) => {
        if (a.role === FrameworkNodeRole.tier && b.role === FrameworkNodeRole.competency) return -1;
        if (a.role === FrameworkNodeRole.competency && b.role === FrameworkNodeRole.tier) return 1;
        return 0;
    });

    return (
        <section className="h-full flex flex-col gap-[10px] pb-[111px] overflow-y-auto z-0">
            {nodes.map((node, i) =>
                node.role === FrameworkNodeRole.tier ? (
                    <TierRow key={i} node={node} framework={framework} />
                ) : (
                    <CompetencyRow key={i} node={node} framework={framework} />
                )
            )}
        </section>
    );
};

export default TiersAndCompetencies;
