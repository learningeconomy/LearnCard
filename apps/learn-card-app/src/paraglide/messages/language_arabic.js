/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Language_ArabicInputs */

const en_language_arabic = /** @type {(inputs: Language_ArabicInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العربية`)
};

const es_language_arabic = /** @type {(inputs: Language_ArabicInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العربية`)
};

const de_language_arabic = /** @type {(inputs: Language_ArabicInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العربية`)
};

const ar_language_arabic = /** @type {(inputs: Language_ArabicInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العربية`)
};

/**
* | output |
* | --- |
* | "العربية" |
*
* @param {Language_ArabicInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const language_arabic = /** @type {((inputs?: Language_ArabicInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Language_ArabicInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_language_arabic(inputs)
	if (locale === "es") return es_language_arabic(inputs)
	if (locale === "de") return de_language_arabic(inputs)
	return ar_language_arabic(inputs)
});
export { language_arabic as "language.arabic" }