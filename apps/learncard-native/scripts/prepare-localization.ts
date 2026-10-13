import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// String Catalog is canonical. Emit portable resources because swift test's CLI does
// not run Xcode's catalog compiler. No Paraglide JavaScript runs in native views.
const root = resolve(import.meta.dir, '..');
const catalog = JSON.parse(
    await readFile(resolve(root, 'localization/Localizable.xcstrings'), 'utf8')
) as {
    sourceLanguage: string;
    strings: Record<
        string,
        {
            localizations: Record<
                string,
                {
                    stringUnit?: { value: string };
                    variations?: {
                        plural: Record<string, { stringUnit: { value: string } }>;
                    };
                }
            >;
        }
    >;
};
const resources = resolve(root, 'ios/NativeCore/Sources/LearnCardNativeSDK/Resources');
const languages = ['en', 'es', 'fr', 'ar'];
const source: Record<string, string> = {};
const xml = (value: string) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const placeholders = (value: string) =>
    [...value.matchAll(/%(?:\d+\$)?(?:@|lld)/g)]
        .map(x => x[0])
        .sort()
        .join(',');
for (const language of languages) {
    const strings: string[] = [],
        plurals: string[] = [];
    for (const [key, entry] of Object.entries(catalog.strings)) {
        const value = entry.localizations[language];
        if (!value) throw new Error(`Missing ${language} translation for ${key}`);
        const base = entry.localizations.en;
        if (value.stringUnit) {
            if (
                !base.stringUnit ||
                placeholders(value.stringUnit.value) !== placeholders(base.stringUnit.value)
            )
                throw new Error(`Placeholder mismatch: ${language}:${key}`);
            strings.push(`${JSON.stringify(key)} = ${JSON.stringify(value.stringUnit.value)};`);
            if (language === 'en') source[key] = value.stringUnit.value;
        } else if (value.variations?.plural) {
            if (!value.variations.plural.other)
                throw new Error(`Missing other plural: ${language}:${key}`);
            const options = Object.entries(value.variations.plural)
                .map(
                    ([variant, item]) =>
                        `<key>${xml(variant)}</key><string>${xml(item.stringUnit.value)}</string>`
                )
                .join('');
            plurals.push(
                `<key>${xml(key)}</key><dict><key>NSStringLocalizedFormatKey</key><string>%#@count@</string><key>count</key><dict><key>NSStringFormatSpecTypeKey</key><string>NSStringPluralRuleType</string><key>NSStringFormatValueTypeKey</key><string>lld</string>${options}</dict></dict>`
            );
            if (language === 'en')
                source[key] = base.variations?.plural.other.stringUnit.value ?? key;
        } else throw new Error(`Missing text: ${language}:${key}`);
    }
    const directory = resolve(resources, `${language}.lproj`);
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, 'Localizable.strings'), strings.join('\n') + '\n');
    await writeFile(
        resolve(directory, 'Localizable.stringsdict'),
        `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict>${plurals.join('')}</dict></plist>\n`
    );
}
await writeFile(resolve(resources, 'native-english.json'), JSON.stringify(source));
console.log(
    `Prepared native catalogs: ${Object.keys(catalog.strings).length} keys, ${languages.length} locales.`
);
