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

const de_ai_noresults1 = /** @type {(inputs: Ai_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keine Suchergebnisse`)
};

const ar_ai_noresults1 = /** @type {(inputs: Ai_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد نتائج`)
};

const fr_ai_noresults1 = /** @type {(inputs: Ai_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat`)
};

const ko_ai_noresults1 = /** @type {(inputs: Ai_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`검색 결과 없음`)
};

/**
* | output |
* | --- |
* | "No Search Results" |
*
* @param {Ai_Noresults1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_noresults1 = /** @type {((inputs?: Ai_Noresults1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Noresults1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_noresults1(inputs)
	if (locale === "es") return es_ai_noresults1(inputs)
	if (locale === "de") return de_ai_noresults1(inputs)
	if (locale === "ar") return ar_ai_noresults1(inputs)
	if (locale === "fr") return fr_ai_noresults1(inputs)
	return ko_ai_noresults1(inputs)
});
export { ai_noresults1 as "ai.noResults" }