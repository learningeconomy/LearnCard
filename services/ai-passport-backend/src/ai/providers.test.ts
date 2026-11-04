import { describe, expect, it } from 'bun:test';
import {
    assertOpenAIReasoningEffort,
    getOpenAIReasoningEffort,
    parseOpenAIModelAlias,
} from './providers';

const solModels = ['gpt-6.1-sol', 'us.openai.gpt-6.1-sol'];
const lunaModels = ['gpt-6-luna', 'us.openai.gpt-6-luna'];
const solEfforts = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
const lunaEfforts = ['none', ...solEfforts] as const;

// These helpers validate first-party/configuration values, not Bedrock acceptance.
describe('first-party Sol6.1 and Luna reasoning configuration contracts', () => {
    it.each([...solModels, ...lunaModels])(
        'uses the documented medium default without an explicit effort for %s',
        model => {
            expect(getOpenAIReasoningEffort(model)).toBe('medium');
        }
    );

    for (const [models, efforts] of [
        [solModels, solEfforts],
        [lunaModels, lunaEfforts],
    ] as const) {
        for (const model of models) {
            it.each([...efforts])('accepts explicit %s reasoning for ' + model, effort => {
                expect(getOpenAIReasoningEffort(model, effort)).toBe(effort);
                expect(parseOpenAIModelAlias(`${model}-${effort}`)).toEqual({
                    apiModel: model,
                    reasoningEffort: effort,
                });
                expect(getOpenAIReasoningEffort(`${model}-${effort}`)).toBe(effort);
            });
        }
    }

    for (const [models, efforts] of [
        [solModels, ['none', 'minimal', 'unsupported']],
        [lunaModels, ['minimal', 'unsupported']],
    ] as const) {
        for (const model of models) {
            it.each([...efforts])('rejects explicit %s reasoning for ' + model, effort => {
                expect(() => assertOpenAIReasoningEffort(model, effort)).toThrow(RangeError);
                expect(() => getOpenAIReasoningEffort(model, effort)).toThrow(RangeError);
            });
        }
    }

    it.each([
        'gpt-6.1-sol-none',
        'us.openai.gpt-6.1-sol-none',
        'gpt-6.1-sol-minimal',
        'us.openai.gpt-6.1-sol-minimal',
        'gpt-6-luna-minimal',
        'us.openai.gpt-6-luna-minimal',
    ])('rejects unsupported aliases instead of substituting an effort for %s', model => {
        expect(() => parseOpenAIModelAlias(model)).toThrow(RangeError);
        expect(() => getOpenAIReasoningEffort(model, 'medium')).toThrow(RangeError);
    });

    it.each([...solModels, ...lunaModels])(
        'lets a supported alias override a valid global effort for %s',
        model => {
            expect(getOpenAIReasoningEffort(`${model}-low`, 'high')).toBe('low');
        }
    );

    it.each(solModels)(
        'does not hide an invalid explicit global effort behind a valid alias for %s',
        model => {
            expect(() => getOpenAIReasoningEffort(`${model}-low`, 'none')).toThrow(RangeError);
        }
    );

    it.each(lunaModels)('does not hide minimal behind a valid Luna alias for %s', model => {
        expect(() => getOpenAIReasoningEffort(`${model}-none`, 'minimal')).toThrow(RangeError);
    });
});
