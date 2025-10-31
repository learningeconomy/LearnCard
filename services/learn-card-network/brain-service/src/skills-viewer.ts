import express from 'express';
import { FastifyPluginAsync } from 'fastify';
import { getSkillFrameworkById } from '@accesslayer/skill-framework/read';
import { getSkillsByIds, getSkillByFrameworkAndId } from '@accesslayer/skill/read';

// Express app for Lambda
export const app = express();

app.get('/skills/:skillId', async (req, res) => {
    try {
        const { skillId } = req.params;
        const skills = await getSkillsByIds([skillId]);
        
        if (skills.length === 0) {
            return res.status(404).json({ error: 'Skill not found' });
        }
        
        const skill = skills[0]!;
        
        return res.json({
            id: skill.id,
            code: skill.code,
            statement: skill.statement,
            description: skill.description,
            type: skill.type,
            status: skill.status,
        });
    } catch (error) {
        console.error('Error fetching skill:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// New compound route: framework-scoped skill
app.get('/frameworks/:frameworkId/skills/:skillId', async (req, res) => {
    try {
        const { frameworkId, skillId } = req.params as { frameworkId: string; skillId: string };
        const skill = await getSkillByFrameworkAndId(frameworkId, skillId);

        if (!skill) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        return res.json({
            id: skill.id,
            code: skill.code,
            statement: skill.statement,
            description: skill.description,
            type: skill.type,
            status: skill.status,
        });
    } catch (error) {
        console.error('Error fetching skill by framework/id:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/frameworks/:frameworkId', async (req, res) => {
    try {
        const { frameworkId } = req.params;
        const framework = await getSkillFrameworkById(frameworkId);
        
        if (!framework) {
            return res.status(404).json({ error: 'Framework not found' });
        }
        
        return res.json({
            id: framework.id,
            name: framework.name,
            description: framework.description,
            image: framework.image,
            sourceURI: framework.sourceURI,
            status: framework.status,
        });
    } catch (error) {
        console.error('Error fetching framework:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Fastify plugin for Docker
export const skillsViewerFastifyPlugin: FastifyPluginAsync = async fastify => {
    fastify.get('/skills/:skillId', async (request, reply) => {
        try {
            const { skillId } = request.params as { skillId: string };
            const skills = await getSkillsByIds([skillId]);
            
            if (skills.length === 0) {
                return reply.status(404).send({ error: 'Skill not found' });
            }
            
            const skill = skills[0]!;
            
            return reply.send({
                id: skill.id,
                code: skill.code,
                statement: skill.statement,
                description: skill.description,
                type: skill.type,
                status: skill.status,
            });
        } catch (error) {
            console.error('Error fetching skill:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // New compound route for framework-scoped skill
    fastify.get('/frameworks/:frameworkId/skills/:skillId', async (request, reply) => {
        try {
            const { frameworkId, skillId } = request.params as { frameworkId: string; skillId: string };
            const skill = await getSkillByFrameworkAndId(frameworkId, skillId);

            if (!skill) {
                return reply.status(404).send({ error: 'Skill not found' });
            }

            return reply.send({
                id: skill.id,
                code: skill.code,
                statement: skill.statement,
                description: skill.description,
                type: skill.type,
                status: skill.status,
            });
        } catch (error) {
            console.error('Error fetching skill by framework/id:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    fastify.get('/frameworks/:frameworkId', async (request, reply) => {
        try {
            const { frameworkId } = request.params as { frameworkId: string };
            const framework = await getSkillFrameworkById(frameworkId);
            
            if (!framework) {
                return reply.status(404).send({ error: 'Framework not found' });
            }
            
            return reply.send({
                id: framework.id,
                name: framework.name,
                description: framework.description,
                image: framework.image,
                sourceURI: framework.sourceURI,
                status: framework.status,
            });
        } catch (error) {
            console.error('Error fetching framework:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
};

export default app;
