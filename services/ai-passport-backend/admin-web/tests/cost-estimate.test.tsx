import { describe, expect, it } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CostEstimate, { unavailablePricing } from '../CostEstimate';
import { costPricing, estimateCosts } from '../../src/admin/cost-model';
import ObservedUsage, { type ObservedCosts } from '../ObservedUsage';

const publicPricing = costPricing({ AWS_REGION: 'us-east-1' });
const render = (pricing = publicPricing) =>
    renderToStaticMarkup(
        createElement(CostEstimate, {
            title: 'Selected paid batch pricing',
            pricing,
            estimate: estimateCosts(25, 5, pricing),
        })
    );

describe('admin cost presentation', () => {
    it('leads with unknown expected cost and unit rates, keeping high-allowance math in a closed disclosure', () => {
        const html = render();
        expect(html).toContain(
            'Expected cost unknown. Measured token/text usage is not available.'
        );
        expect(html).toContain('$0.1350 per million tokens');
        expect(html).toContain('$0.1100 per million tokens');
        expect(html).toContain('$0.5500 per million tokens');
        expect(html).toContain('$0.1000 per thousand text units');
        expect(html).toMatch(/<details(?![^>]*\bopen\b)[^>]*>/);
        expect(html).toContain('Conservative stress scenario (not a forecast or spending cap)');
        expect(html.indexOf('<details')).toBeLessThan(html.indexOf('Scenario total (USD)'));
        expect(html).toContain('$0.1999');
        expect(html).toContain('do not represent typical usage or expected spending');
        expect(html).toContain('not a measured bill or a hard dollar cap');
        expect(html).toContain('retries can incur charges again');
    });

    it('discloses incomplete rates without presenting known subtotal as a full total', () => {
        const html = render({
            ...publicPricing,
            generationModel: null,
            generationInputUsdPerMillionTokens: null,
            generationOutputUsdPerMillionTokens: null,
        });
        expect(html).toContain('Known subtotal (incomplete)');
        expect(html).toContain('$0.1776');
        expect(html).toContain('Representation generation unknown');
        expect(html).not.toContain('Scenario total (USD)');
        expect(html).toContain('a full total is unavailable');
    });

    it('supports old responses with no pricing or estimate data', () => {
        const html = renderToStaticMarkup(
            createElement(CostEstimate, {
                title: 'Cumulative job cost planning',
                estimate: estimateCosts(5, 1, unavailablePricing),
            })
        );
        expect(html).toContain('Pricing metadata is unavailable');
        expect(html).toContain('Known subtotal (incomplete)');
        expect(html).not.toContain('Scenario total (USD)');
        expect(html).toContain('Embedding, Representation generation, Privacy inspection unknown');
        expect(
            renderToStaticMarkup(
                createElement(CostEstimate, {
                    title: 'Invalid scenario',
                    estimate: null,
                    pricing: publicPricing,
                })
            )
        ).not.toContain('<dl');
    });
});

// Synthetic rendering fixtures only; never used as production usage defaults.
const measuredFixture: ObservedCosts = {
    attempts: 3,
    failedAttempts: 1,
    historicalRequestsUnmeasured: true,
    knownListPriceUsd: 0.0012,
    unpricedComponents: [],
    totals: {
        generation: {
            requests: 3,
            measuredRequests: 2,
            inputTokens: 2000,
            outputTokens: 800,
        },
        embedding: { requests: 10, measuredRequests: 0, inputTokens: 0 },
        privacy: {
            requests: 7,
            measuredRequests: 6,
            textUnits: 6,
            freeTextUnits: 0,
        },
    },
    unmeasuredRequests: { generation: 1, embedding: 10, privacy: 1 },
    sample: {
        count: 2,
        meanKnownUsd: 0.0006,
        meanWithEmbeddingAllowanceUsd: 0.0061296,
        minKnownUsd: 0.0004,
        maxWithEmbeddingAllowanceUsd: 0.007,
    },
    pricesMatch: true,
};

describe('observed cost presentation', () => {
    it('scales successful sample means while clearly separating measured usage from embedding allowance', () => {
        const html = renderToStaticMarkup(
            createElement(ObservedUsage, { usage: measuredFixture, recordLimit: 5 })
        );
        expect(html).toContain('Measured generation/privacy + embedding allowance');
        expect(html).toContain('Sample-based planning range for 5 records: $0.0030–$0.0306');
        expect(html).toContain('Based on 2 successful credential attempts');
        expect(html).toContain('not fully measured totals or guaranteed spending bounds');
        expect(html).toContain('lower figure excludes unmeasured embedding charges');
        expect(html).toContain('Earlier job attempts have no measured usage');
        expect(html).toContain('3 recorded attempts; 1 failed');
        expect(html).toContain('Failed or incomplete attempts are excluded from the sample');
        expect(html).toContain('Unmeasured requests: 1 generation, 10 embedding, 1 privacy');
    });

    it('keeps expected costs unknown without comparable samples or after pricing changes', () => {
        const incomplete = renderToStaticMarkup(
            createElement(ObservedUsage, {
                usage: { ...measuredFixture, sample: null },
                recordLimit: 5,
            })
        );
        expect(incomplete).toContain('Expected cost unknown');
        expect(incomplete).not.toContain('Sample-based planning range');
        const changed = renderToStaticMarkup(
            createElement(ObservedUsage, {
                usage: { ...measuredFixture, pricesMatch: false },
                recordLimit: 5,
            })
        );
        expect(changed).toContain('Pricing configuration changed');
        expect(changed).toContain('Expected cost unknown');
        expect(changed).not.toContain('Sample-based planning range');
        const unpriced = renderToStaticMarkup(
            createElement(ObservedUsage, {
                usage: { ...measuredFixture, unpricedComponents: ['generation'] },
                recordLimit: 5,
            })
        );
        expect(unpriced).toContain('Unpriced measured components: generation');
        expect(unpriced).toContain('Their rates and charges are unknown');
        expect(unpriced).not.toContain('Sample-based planning range');
    });

    it('does not extrapolate an invalid record limit or cumulative job summary', () => {
        for (const recordLimit of [undefined, 0, -1, 1.5]) {
            const html = renderToStaticMarkup(
                createElement(ObservedUsage, { usage: measuredFixture, recordLimit })
            );
            expect(html).not.toContain('Sample-based planning range');
            expect(html).toContain('Per-record sample mean');
        }
    });
});
