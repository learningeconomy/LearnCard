/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Newsession1Inputs */

const en_ai_newsession1 = /** @type {(inputs: Ai_Newsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Topic`)
};

const es_ai_newsession1 = /** @type {(inputs: Ai_Newsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo tema`)
};

const de_ai_newsession1 = /** @type {(inputs: Ai_Newsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neues Thema`)
};

const ar_ai_newsession1 = /** @type {(inputs: Ai_Newsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موضوع جديد`)
};

const fr_ai_newsession1 = /** @type {(inputs: Ai_Newsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau sujet`)
};

const ko_ai_newsession1 = /** @type {(inputs: Ai_Newsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 주제`)
};

/**
* | output |
* | --- |
* | "New Topic" |
*
* @param {Ai_Newsession1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_newsession1 = /** @type {((inputs?: Ai_Newsession1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Newsession1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_newsession1(inputs)
	if (locale === "es") return es_ai_newsession1(inputs)
	if (locale === "de") return de_ai_newsession1(inputs)
	if (locale === "ar") return ar_ai_newsession1(inputs)
	if (locale === "fr") return fr_ai_newsession1(inputs)
	return ko_ai_newsession1(inputs)
});
export { ai_newsession1 as "ai.newSession" }