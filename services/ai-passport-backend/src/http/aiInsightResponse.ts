import type { generateAIInsightCredential } from '../services/awarding';
import {
    runAiInsightDiagnostics,
    withAiInsightStage,
    observeAiInsightResponseConstructed,
} from '../diagnostics/ai-insight';

// Shared by the real POST handler and offline HTTP contract tests. The service
// Result alone does not establish that its HTTP envelope can be constructed.
export const createAiInsightHttpResponse = (
    generate: () => ReturnType<typeof generateAIInsightCredential>,
    jsonResponse: (data: unknown, status?: number) => Response,
    options: { signal?: AbortSignal } = {}
): Promise<Response> =>
    runAiInsightDiagnostics(async () => {
        const result = await generate();
        const response = await withAiInsightStage('response_assembly', () => {
            if (!result) return jsonResponse(null, 204);
            const { vc, compaction, inputCoverage } = result;
            const { insights } = vc;
            return jsonResponse({
                success: true,
                credential: vc,
                insights: {
                    strongestArea: insights.strongestArea,
                    weakestArea: insights.weakestArea,
                    roomForGrowth: insights.roomForGrowth,
                },
                meta: {
                    credentialsAnalyzed: insights.credentialsAnalyzed,
                    inputCoverage,
                    generatedAt: insights.analysisDate,
                    compactionOriginalChars: compaction.originalChars,
                    compactionCompactChars: compaction.compactChars,
                    compactionPercent: compaction.compactionPercent,
                },
            });
        });
        observeAiInsightResponseConstructed(response.status);
        return response;
    }, options);
