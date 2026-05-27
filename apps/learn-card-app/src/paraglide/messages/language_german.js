/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Language_GermanInputs */

const en_language_german = /** @type {(inputs: Language_GermanInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deutsch`)
};

const es_language_german = /** @type {(inputs: Language_GermanInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deutsch`)
};

const de_language_german = /** @type {(inputs: Language_GermanInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deutsch`)
};

const ar_language_german = /** @type {(inputs: Language_GermanInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deutsch`)
};

/**
* | output |
* | --- |
* | "Deutsch" |
*
* @param {Language_GermanInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const language_german = /** @type {((inputs?: Language_GermanInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Language_GermanInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_language_german(inputs)
	if (locale === "es") return es_language_german(inputs)
	if (locale === "de") return de_language_german(inputs)
	return ar_language_german(inputs)
});
export { language_german as "language.german" }