import { describe, expect, it } from 'bun:test';
import { InsightsArtifactValidator } from '../ai/generation-schemas';

const artifact = (title: string) => ({
    category: 'Achievement',
    title,
    summary: 'Localized summary',
    narrative: 'Localized narrative',
    question: 'Localized question?',
});

describe('InsightsArtifactValidator localized titles', () => {
    it('accepts Arabic titles', () => {
        expect(InsightsArtifactValidator.safeParse(artifact('إنجاز جديد')).success).toBe(true);
    });

    it('accepts Latin titles with accents', () => {
        expect(InsightsArtifactValidator.safeParse(artifact('Réussite Éducative')).success).toBe(
            true
        );
    });

    it('still rejects punctuation and digits', () => {
        expect(InsightsArtifactValidator.safeParse(artifact('Achievement 2!')).success).toBe(false);
    });
});
