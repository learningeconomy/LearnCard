/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_SetInputs */

const en_ai_set = /** @type {(inputs: Ai_SetInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set`)
};

const es_ai_set = /** @type {(inputs: Ai_SetInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Establecer`)
};

const fr_ai_set = /** @type {(inputs: Ai_SetInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Définir`)
};

const ar_ai_set = /** @type {(inputs: Ai_SetInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعيين`)
};

/**
* | output |
* | --- |
* | "Set" |
*
* @param {Ai_SetInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_set = /** @type {((inputs?: Ai_SetInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_SetInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_set(inputs)
	if (locale === "es") return es_ai_set(inputs)
	if (locale === "fr") return fr_ai_set(inputs)
	return ar_ai_set(inputs)
});
export { ai_set as "ai.set" }