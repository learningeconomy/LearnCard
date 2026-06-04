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

const de_language_select = /** @type {(inputs: Language_SelectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sprache wählen`)
};

const ar_language_select = /** @type {(inputs: Language_SelectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار اللغة`)
};

const fr_language_select = /** @type {(inputs: Language_SelectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner la langue`)
};

const ko_language_select = /** @type {(inputs: Language_SelectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`언어 선택`)
};

/**
* | output |
* | --- |
* | "Select language" |
*
* @param {Language_SelectInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const language_select = /** @type {((inputs?: Language_SelectInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Language_SelectInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_language_select(inputs)
	if (locale === "es") return es_language_select(inputs)
	if (locale === "de") return de_language_select(inputs)
	if (locale === "ar") return ar_language_select(inputs)
	if (locale === "fr") return fr_language_select(inputs)
	return ko_language_select(inputs)
});
export { language_select as "language.select" }