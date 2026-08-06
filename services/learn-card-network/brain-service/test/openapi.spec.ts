import { openApiDocument } from '../src/openapi';

// The import itself is the test: `src/openapi.ts` calls generateOpenApiDocument
// at module load, so a Zod 4 / trpc-to-openapi regression throws here instead of
// at Lambda cold start.
describe('OpenAPI generation', () => {
    it('generates the document at boot without throwing', () => {
        expect(openApiDocument).toBeDefined();
        expect(Object.keys(openApiDocument.paths ?? {}).length).toBeGreaterThan(0);
    });

    it('includes the skill-search route whose $regex query previously broke generation', () => {
        const paths = Object.keys(openApiDocument.paths ?? {});

        expect(paths).toContain('/boost/skills/search');
    });
});
