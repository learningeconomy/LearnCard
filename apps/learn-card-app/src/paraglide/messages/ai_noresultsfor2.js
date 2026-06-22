/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Noresultsfor2Inputs */

const en_ai_noresultsfor2 = /** @type {(inputs: Ai_Noresultsfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No results found for`)
};

const es_ai_noresultsfor2 = /** @type {(inputs: Ai_Noresultsfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin resultados para`)
};

const fr_ai_noresultsfor2 = /** @type {(inputs: Ai_Noresultsfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat pour`)
};

const ar_ai_noresultsfor2 = /** @type {(inputs: Ai_Noresultsfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد نتائج لـ`)
};

/**
* | output |
* | --- |
* | "No results found for" |
*
* @param {Ai_Noresultsfor2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_noresultsfor2 = /** @type {((inputs?: Ai_Noresultsfor2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Noresultsfor2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_noresultsfor2(inputs)
	if (locale === "es") return es_ai_noresultsfor2(inputs)
	if (locale === "fr") return fr_ai_noresultsfor2(inputs)
	return ar_ai_noresultsfor2(inputs)
});
export { ai_noresultsfor2 as "ai.noResultsFor" }