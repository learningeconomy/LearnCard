/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Language_SelectInputs */

const en_language_select = /** @type {(inputs: Language_SelectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select language`)
};

const es_language_select = /** @type {(inputs: Language_SelectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar idioma`)
};

const fr_language_select = /** @type {(inputs: Language_SelectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner la langue`)
};

const ar_language_select = /** @type {(inputs: Language_SelectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار اللغة`)
};

/**
* | output |
* | --- |
* | "Select language" |
*
* @param {Language_SelectInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const language_select = /** @type {((inputs?: Language_SelectInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Language_SelectInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_language_select(inputs)
	if (locale === "es") return es_language_select(inputs)
	if (locale === "fr") return fr_language_select(inputs)
	return ar_language_select(inputs)
});
export { language_select as "language.select" }