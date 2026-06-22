/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Noresults1Inputs */

const en_ai_noresults1 = /** @type {(inputs: Ai_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Search Results`)
};

const es_ai_noresults1 = /** @type {(inputs: Ai_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin resultados`)
};

const fr_ai_noresults1 = /** @type {(inputs: Ai_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat`)
};

const ar_ai_noresults1 = /** @type {(inputs: Ai_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد نتائج`)
};

/**
* | output |
* | --- |
* | "No Search Results" |
*
* @param {Ai_Noresults1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_noresults1 = /** @type {((inputs?: Ai_Noresults1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Noresults1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_noresults1(inputs)
	if (locale === "es") return es_ai_noresults1(inputs)
	if (locale === "fr") return fr_ai_noresults1(inputs)
	return ar_ai_noresults1(inputs)
});
export { ai_noresults1 as "ai.noResults" }