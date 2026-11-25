import { expect, test } from 'bun:test';
import { assertPrivacyLocale } from './privacy-language';
import {
    privacyFailureDetails,
    withPrivacyInputOrigin,
    withPrivacyOperation,
} from './privacy-diagnostics';
test('locale policy remains independent and unchanged', () => {
    for (const locale of [undefined, 'en', 'en-US', 'es', 'fr', 'ar', 'ja', 'zh', 'hi', 'nb', 'nn'])
        expect(() => assertPrivacyLocale(locale)).not.toThrow();
    for (const locale of ['ru-RU', 'el', 'th', 'unknown'])
        expect(() => assertPrivacyLocale(locale)).toThrow();
});
test('unsupported locale retains fixed metadata without content detection', async () => {
    const failure = await withPrivacyInputOrigin('request_instructions', () =>
        withPrivacyOperation('language', () => assertPrivacyLocale('ru'))
    ).catch(error => error);
    expect(privacyFailureDetails(failure)).toEqual({
        privacyOperation: 'language',
        privacyCategory: 'unsupported_language',
        privacyLanguageReason: 'locale',
        privacyInputOrigin: 'request_instructions',
    });
});
