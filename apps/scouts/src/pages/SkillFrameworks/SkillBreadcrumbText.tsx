import React from 'react';
import { useGetSkillPath } from 'learn-card-base';
import { FrameworkNodeRole, SkillFrameworkNode } from '../../components/boost/boost';
import { convertSkillToBackendFormat } from '../../helpers/skillFramework.helpers';

type SkillBreadcrumbTextProps =
    | {
          frameworkId: string;
          skillId: string;
          path?: SkillFrameworkNode[];
          includeSkill?: boolean;
      }
    | {
          frameworkId?: string;
          skillId?: string;
          path: SkillFrameworkNode[];
          includeSkill?: boolean;
      };

const SkillBreadcrumbText: React.FC<SkillBreadcrumbTextProps> = ({
    frameworkId,
    skillId,
    path: _path,
    includeSkill = false,
}) => {
    const { data: pathData, isLoading: pathLoading } = useGetSkillPath(frameworkId, skillId);

    const pathToUse =
        _path?.map(node => convertSkillToBackendFormat(node)) ??
        [...(pathData?.path ?? [])].reverse();
    const path = [...(pathToUse ?? [])].filter(node => includeSkill || node.id !== skillId);

    return (
        <p className="text-grayscale-700 font-poppins text-[12px] font-[600]">
            {path.map((node, index) => {
                const isCompetency = node.type === FrameworkNodeRole.competency;
                return (
                    <span
                        key={index}
                        className={
                            isCompetency ? 'bg-violet-100 px-[5px] py-[1px] rounded-[5px]' : ''
                        }
                    >
                        {isCompetency && `${node.icon} `}
                        {node.targetName || node.statement}
                        {index < path.length - 1 ? ' > ' : ''}
                    </span>
                );
            })}
        </p>
    );
};

export default SkillBreadcrumbText;
