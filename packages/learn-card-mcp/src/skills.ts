import { Router } from 'express';

/** A Markdown skill document an MCP host publishes for agents to read. */
export type McpSkill = {
    name: string;
    description: string;
    content: string;
};

const SKILL_NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * Serves `GET /` (index JSON) and `GET /:name` (Markdown) for the given skills.
 * Mount it at a path such as `/skills`. Skills are public: never put user data in them.
 */
export const createSkillsRouter = (skills: readonly McpSkill[]): Router => {
    const byName = new Map<string, McpSkill>();
    for (const skill of skills) {
        if (!SKILL_NAME.test(skill.name)) throw new Error(`Invalid skill name: ${skill.name}`);
        if (byName.has(skill.name)) throw new Error(`Duplicate skill name: ${skill.name}`);
        byName.set(skill.name, skill);
    }

    const router = Router();

    router.get('/', (_req, res) => {
        res.json({
            skills: [...byName.values()].map(({ name, description }) => ({ name, description })),
        });
    });

    router.get('/:name', (req, res) => {
        const skill = byName.get(req.params.name ?? '');
        if (!skill) {
            res.status(404).json({ error: 'Skill not found', code: 'not_found' });
            return;
        }
        res.type('text/markdown; charset=utf-8').send(skill.content);
    });

    return router;
};
