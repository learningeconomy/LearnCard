/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_ErrorInputs */

const en_ai_error = /** @type {(inputs: Ai_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error occurred`)
};

const es_ai_error = /** @type {(inputs: Ai_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error`)
};

const de_ai_error = /** @type {(inputs: Ai_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ein Fehler ist aufgetreten`)
};

const ar_ai_error = /** @type {(inputs: Ai_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ`)
};

const fr_ai_error = /** @type {(inputs: Ai_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue`)
};

const ko_ai_error = /** @type {(inputs: Ai_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`오류가 발생했습니다`)
};

/**
* | output |
* | --- |
* | "An error occurred" |
*
* @param {Ai_ErrorInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_error = /** @type {((inputs?: Ai_ErrorInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_ErrorInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_error(inputs)
	if (locale === "es") return es_ai_error(inputs)
	if (locale === "de") return de_ai_error(inputs)
	if (locale === "ar") return ar_ai_error(inputs)
	if (locale === "fr") return fr_ai_error(inputs)
	return ko_ai_error(inputs)
});
export { ai_error as "ai.error" }