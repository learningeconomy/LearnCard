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

const fr_ai_error = /** @type {(inputs: Ai_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue`)
};

const ar_ai_error = /** @type {(inputs: Ai_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ`)
};

/**
* | output |
* | --- |
* | "An error occurred" |
*
* @param {Ai_ErrorInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_error = /** @type {((inputs?: Ai_ErrorInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_ErrorInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_error(inputs)
	if (locale === "es") return es_ai_error(inputs)
	if (locale === "fr") return fr_ai_error(inputs)
	return ar_ai_error(inputs)
});
export { ai_error as "ai.error" }