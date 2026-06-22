/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_NewInputs */

const en_ai_new = /** @type {(inputs: Ai_NewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New`)
};

const es_ai_new = /** @type {(inputs: Ai_NewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo`)
};

const fr_ai_new = /** @type {(inputs: Ai_NewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau`)
};

const ar_ai_new = /** @type {(inputs: Ai_NewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جديد`)
};

/**
* | output |
* | --- |
* | "New" |
*
* @param {Ai_NewInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_new = /** @type {((inputs?: Ai_NewInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_NewInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_new(inputs)
	if (locale === "es") return es_ai_new(inputs)
	if (locale === "fr") return fr_ai_new(inputs)
	return ar_ai_new(inputs)
});
export { ai_new as "ai.new" }