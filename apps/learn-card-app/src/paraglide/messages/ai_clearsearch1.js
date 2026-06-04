/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Clearsearch1Inputs */

const en_ai_clearsearch1 = /** @type {(inputs: Ai_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search`)
};

const es_ai_clearsearch1 = /** @type {(inputs: Ai_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar`)
};

const de_ai_clearsearch1 = /** @type {(inputs: Ai_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suchen`)
};

const ar_ai_clearsearch1 = /** @type {(inputs: Ai_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بحث`)
};

const fr_ai_clearsearch1 = /** @type {(inputs: Ai_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher`)
};

const ko_ai_clearsearch1 = /** @type {(inputs: Ai_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`검색`)
};

/**
* | output |
* | --- |
* | "Search" |
*
* @param {Ai_Clearsearch1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_clearsearch1 = /** @type {((inputs?: Ai_Clearsearch1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Clearsearch1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_clearsearch1(inputs)
	if (locale === "es") return es_ai_clearsearch1(inputs)
	if (locale === "de") return de_ai_clearsearch1(inputs)
	if (locale === "ar") return ar_ai_clearsearch1(inputs)
	if (locale === "fr") return fr_ai_clearsearch1(inputs)
	return ko_ai_clearsearch1(inputs)
});
export { ai_clearsearch1 as "ai.clearSearch" }