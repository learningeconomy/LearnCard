import type { SessionPlanData } from '../ai/generation-schemas';

export const formatSessionPlanMarkdown = (plan: SessionPlanData): string => {
    const formatSection = (heading: string, items: string[]): string =>
        `${heading}${items.length > 0 ? `\n${items.join('\n')}` : ''}`;
    const roadmap = plan.roadmap.map(
        ({ module, description, learningObjectives }, index) =>
            `${index + 1}. **${module}** — ${description}${
                learningObjectives.length > 0
                    ? `\n${learningObjectives.map(objective => `   - ${objective}`).join('\n')}`
                    : ''
            }`
    );

    return [
        `# ${plan.welcome}`,
        plan.summary,
        formatSection(
            '## Objectives',
            plan.objectives.map(objective => `- ${objective}`)
        ),
        formatSection(
            '## Skills You Can Earn',
            plan.skills.map(skill => `- ${skill}`)
        ),
        formatSection('## Roadmap', roadmap),
    ].join('\n\n');
};
