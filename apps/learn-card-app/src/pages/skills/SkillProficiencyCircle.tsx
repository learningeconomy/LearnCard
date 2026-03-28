import React from 'react';
import { SkillLevel, SKILL_LEVEL_META } from './skillTypes';

type SkillProficiencyCircleProps = {
    proficiencyLevel: SkillLevel;
    children: React.ReactNode;
    size?: number;
};

const SkillProficiencyCircle: React.FC<SkillProficiencyCircleProps> = ({
    proficiencyLevel,
    children,
    size = 30,
}) => {
    const numBars = 5;
    const gapDegrees = 16;
    const barDegrees = (360 - numBars * gapDegrees) / numBars;
    const strokeWidth = 2.5;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;

    const color = SKILL_LEVEL_META[proficiencyLevel].color;
    const isHidden = proficiencyLevel === SkillLevel.Hidden;

    const polarToCartesian = (cx: number, cy: number, r: number, angleDegrees: number) => {
        const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;
        return {
            x: cx + r * Math.cos(angleRadians),
            y: cy + r * Math.sin(angleRadians),
        };
    };

    const describeArc = (
        cx: number,
        cy: number,
        r: number,
        startAngle: number,
        endAngle: number
    ) => {
        const start = polarToCartesian(cx, cy, r, endAngle);
        const end = polarToCartesian(cx, cy, r, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
    };

    const bars = isHidden
        ? null
        : Array.from({ length: numBars }, (_, i) => {
              const barIndex = i + 1;
              const startAngle = i * (barDegrees + gapDegrees);
              const endAngle = startAngle + barDegrees;

              const isActive = barIndex <= proficiencyLevel;

              return (
                  <path
                      key={i}
                      d={describeArc(center, center, radius, startAngle, endAngle)}
                      fill="none"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      className={isActive ? `stroke-${color}` : 'stroke-grayscale-400'}
                  />
              );
          });

    return (
        <div
            className="relative inline-flex items-center justify-center"
            style={{ width: size, height: size }}
        >
            {bars && (
                <svg
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: '100%', height: '100%' }}
                    viewBox={`0 0 ${size} ${size}`}
                    preserveAspectRatio="xMidYMid meet"
                >
                    {bars}
                </svg>
            )}
            {children}
            {/* Tailwind color classes for purge */}
            <span className="hidden stroke-grayscale-400 stroke-grayscale-700 stroke-orange-400 stroke-violet-500 stroke-light-blue-500 stroke-emerald-500" />
        </div>
    );
};

export default SkillProficiencyCircle;
