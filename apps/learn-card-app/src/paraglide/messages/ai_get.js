/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_GetInputs */

const en_ai_get = /** @type {(inputs: Ai_GetInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get`)
};

const es_ai_get = /** @type {(inputs: Ai_GetInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener`)
};

const fr_ai_get = /** @type {(inputs: Ai_GetInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir`)
};

const ar_ai_get = /** @type {(inputs: Ai_GetInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول على`)
};

/**
* | output |
* | --- |
* | "Get" |
*
* @param {Ai_GetInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_get = /** @type {((inputs?: Ai_GetInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_GetInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_get(inputs)
	if (locale === "es") return es_ai_get(inputs)
	if (locale === "fr") return fr_ai_get(inputs)
	return ar_ai_get(inputs)
});
export { ai_get as "ai.get" }