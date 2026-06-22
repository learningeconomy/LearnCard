/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_DismissInputs */

const en_ai_dismiss = /** @type {(inputs: Ai_DismissInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dismiss`)
};

const es_ai_dismiss = /** @type {(inputs: Ai_DismissInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descartar`)
};

const fr_ai_dismiss = /** @type {(inputs: Ai_DismissInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ignorer`)
};

const ar_ai_dismiss = /** @type {(inputs: Ai_DismissInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفض`)
};

/**
* | output |
* | --- |
* | "Dismiss" |
*
* @param {Ai_DismissInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_dismiss = /** @type {((inputs?: Ai_DismissInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_DismissInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_dismiss(inputs)
	if (locale === "es") return es_ai_dismiss(inputs)
	if (locale === "fr") return fr_ai_dismiss(inputs)
	return ar_ai_dismiss(inputs)
});
export { ai_dismiss as "ai.dismiss" }