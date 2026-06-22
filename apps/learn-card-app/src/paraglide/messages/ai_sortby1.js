/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Sortby1Inputs */

const en_ai_sortby1 = /** @type {(inputs: Ai_Sortby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sort by`)
};

const es_ai_sortby1 = /** @type {(inputs: Ai_Sortby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ordenar por`)
};

const fr_ai_sortby1 = /** @type {(inputs: Ai_Sortby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trier par`)
};

const ar_ai_sortby1 = /** @type {(inputs: Ai_Sortby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ترتيب حسب`)
};

/**
* | output |
* | --- |
* | "Sort by" |
*
* @param {Ai_Sortby1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_sortby1 = /** @type {((inputs?: Ai_Sortby1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Sortby1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_sortby1(inputs)
	if (locale === "es") return es_ai_sortby1(inputs)
	if (locale === "fr") return fr_ai_sortby1(inputs)
	return ar_ai_sortby1(inputs)
});
export { ai_sortby1 as "ai.sortBy" }