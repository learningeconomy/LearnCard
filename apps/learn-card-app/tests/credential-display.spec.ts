import { expect } from '@playwright/test';
import { test } from './fixtures/test';

test.describe('Credential Display', () => {
    test.skip('Credential Identity Display', async ({ page }) => {
        const mockBoost = {
            type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential"],
            image: "https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/oUwwRnmoQWm7qogkQSUi",
            skills: [
                { skill: "psychology", category: "social", subskills: ["socialPsychology"] },
                { skill: "adaptability", category: "durable", subskills: ["problemSolving"] },
            ],
            issuer: {
                name: "LearnFleet Academy",
                image: "https://cdn.filestackcontent.com/lq3smJpRLSNQCD0Nt5Qm",
                id: "did:key:z6MkwKoFgbacSSJseV9syL2r2RdwdV1FtV5SBQM1KmNz8Lja",
            },
            display: {
                displayType: "certificate",
                backgroundColor: "#353E64",
                backgroundImage: "https://cdn.filestackcontent.com/v0yds1IxQuC91BeQYPfz",
            },
            credentialSubject: {
                type: ["AchievementSubject"],
                achievement: {
                    type: ["Achievement"],
                    name: "Galactic Peacekeeper",
                    image: "https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/oUwwRnmoQWm7qogkQSUi",
                    criteria: {
                        narrative: "Successfully resolve a simulated diplomatic crisis...",
                    },
                    description: "Honors cadets who have successfully mediated...",
                    achievementType: "Award",
                },
                id: "did:key:z6Mkfa5943iyGtMj2aRJCcw3BZgwo5Bi7jH7FGq4iWrYPy4w",
                identifier: {
                    type: "IdentityObject",
                    hashed: false,
                    identityHash: "Random Name",
                    identityType: "name",
                },
            },
            id: "661edb3e26d9f028f3a99816",
            issuanceDate: "2025-01-17T21:30:54Z",
        };

        const urlToMock = 'https://network.learncard.com/api/storage/resolve?uri=mock-boost-uri';
        await page.route(urlToMock, (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockBoost),
            });
        });
        await page.goto('/claim/boost?boostUri=mock-boost-uri');
        await expect(page.getByText('Random Name')).toBeVisible({ timeout: 11000 });
    }) 
})