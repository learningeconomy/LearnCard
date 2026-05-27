/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Language_EnglishInputs */

const en_language_english = /** @type {(inputs: Language_EnglishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`English`)
};

const es_language_english = /** @type {(inputs: Language_EnglishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`English`)
};

const de_language_english = /** @type {(inputs: Language_EnglishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`English`)
};

const ar_language_english = /** @type {(inputs: Language_EnglishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`English`)
};

/**
* | output |
* | --- |
* | "English" |
*
* @param {Language_EnglishInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const language_english = /** @type {((inputs?: Language_EnglishInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Language_EnglishInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_language_english(inputs)
	if (locale === "es") return es_language_english(inputs)
	if (locale === "de") return de_language_english(inputs)
	return ar_language_english(inputs)
});
export { language_english as "language.english" }