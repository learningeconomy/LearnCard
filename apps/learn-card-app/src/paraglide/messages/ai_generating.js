/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_GeneratingInputs */

const en_ai_generating = /** @type {(inputs: Ai_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating...`)
};

const es_ai_generating = /** @type {(inputs: Ai_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando...`)
};

const fr_ai_generating = /** @type {(inputs: Ai_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération...`)
};

const ar_ai_generating = /** @type {(inputs: Ai_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التوليد...`)
};

/**
* | output |
* | --- |
* | "Generating..." |
*
* @param {Ai_GeneratingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_generating = /** @type {((inputs?: Ai_GeneratingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_GeneratingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_generating(inputs)
	if (locale === "es") return es_ai_generating(inputs)
	if (locale === "fr") return fr_ai_generating(inputs)
	return ar_ai_generating(inputs)
});
export { ai_generating as "ai.generating" }