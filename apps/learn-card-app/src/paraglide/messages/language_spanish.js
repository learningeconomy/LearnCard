/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Language_SpanishInputs */

const en_language_spanish = /** @type {(inputs: Language_SpanishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Español`)
};

const es_language_spanish = /** @type {(inputs: Language_SpanishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Español`)
};

const fr_language_spanish = /** @type {(inputs: Language_SpanishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Español`)
};

const ar_language_spanish = /** @type {(inputs: Language_SpanishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Español`)
};

/**
* | output |
* | --- |
* | "Español" |
*
* @param {Language_SpanishInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const language_spanish = /** @type {((inputs?: Language_SpanishInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Language_SpanishInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_language_spanish(inputs)
	if (locale === "es") return es_language_spanish(inputs)
	if (locale === "fr") return fr_language_spanish(inputs)
	return ar_language_spanish(inputs)
});
export { language_spanish as "language.spanish" }