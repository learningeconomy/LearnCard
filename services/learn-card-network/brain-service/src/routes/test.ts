import { t, openRoute } from '@routes';
import cache from '@cache';
import { z } from 'zod';
import { NotificationSchema } from '../services/delivery/delivery.service';
import { LCNNotificationValidator } from '@learncard/types';
import { __skillsProviderTestUtils } from '@services/skills-provider';

export const testRouter = t.router({
    lastDelivery: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/test/last-delivery',
                tags: ['Test'],
                summary: 'Get last delivery',
                description: 'Get the last delivery',
            },
        })
        .input(z.void())
        .output(NotificationSchema.or(z.null()))
        .query(async () => {
            const deliveryData = await cache.get('e2e:last-delivery');

            if (!deliveryData) {
                return null;
            }
    
            try {
                const notification = JSON.parse(deliveryData);
                return notification;
            } catch (error) {
                console.error('Failed to parse cached delivery data:', error);
                return null;
            }
        }),
    notificationQueue: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/test/notification-queue',
                tags: ['Test'],
                summary: 'Get notification queue',
                description: 'Get the notification queue',
            },
        })
        .input(z.void())
        .output(z.array(LCNNotificationValidator))
        .query(async () => {
            const notificationQueue = await cache.keys('e2e:notification-queue:*');

            if (!notificationQueue) {  
                return [];
            }

            const notifications = await Promise.all(
                notificationQueue.map(async key => {
                    const notificationData = await cache.get(key);
                    if (!notificationData) return null;
                    try {
                        return JSON.parse(notificationData);
                    } catch (error) {
                        console.error('Failed to parse cached notification:', error);
                        return null;
                    }
                })
            );

            return notifications.filter((notification): notification is NonNullable<typeof notification> => notification !== null);
        }),

    // E2E-only: Seed dummy skills provider framework
    seedSkillsProviderFramework: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/test/skills-provider/framework',
                tags: ['Test'],
                summary: 'Seed dummy skills provider framework',
                description: 'Seeds a framework into the in-memory dummy skills provider (E2E only).',
            },
        })
        .input(
            z.object({
                id: z.string(),
                name: z.string(),
                description: z.string().optional(),
                sourceURI: z.string().url().optional(),
            })
        )
        .output(z.object({ success: z.literal(true) }))
        .mutation(async ({ input }) => {
            const framework: Parameters<typeof __skillsProviderTestUtils.seedFramework>[0] = input;
            __skillsProviderTestUtils.seedFramework(framework);
            return { success: true } as const;
        }),

    // E2E-only: Seed dummy skills provider skills
    seedSkillsProviderSkills: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/test/skills-provider/skills',
                tags: ['Test'],
                summary: 'Seed dummy skills for framework',
                description: 'Seeds skills for a framework into the in-memory dummy skills provider (E2E only).',
            },
        })
        .input(
            z.object({
                frameworkId: z.string(),
                skills: z.array(
                    z.object({
                        id: z.string(),
                        statement: z.string(),
                        description: z.string().optional(),
                        code: z.string().optional(),
                        type: z.string().optional(),
                        status: z.string().optional(),
                        parentId: z.string().nullable().optional(),
                    })
                ),
            })
        )
        .output(z.object({ success: z.literal(true) }))
        .mutation(async ({ input }) => {
            const skills: Parameters<typeof __skillsProviderTestUtils.seedSkills>[1] = input.skills;
            __skillsProviderTestUtils.seedSkills(input.frameworkId, skills);
            return { success: true } as const;
        }),

});

export type TestRouter = typeof testRouter;
