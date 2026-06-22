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

const fr_ai_newsession1 = /** @type {(inputs: Ai_Newsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau sujet`)
};

const ar_ai_newsession1 = /** @type {(inputs: Ai_Newsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موضوع جديد`)
};

/**
* | output |
* | --- |
* | "New Topic" |
*
* @param {Ai_Newsession1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_newsession1 = /** @type {((inputs?: Ai_Newsession1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Newsession1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_newsession1(inputs)
	if (locale === "es") return es_ai_newsession1(inputs)
	if (locale === "fr") return fr_ai_newsession1(inputs)
	return ar_ai_newsession1(inputs)
});
export { ai_newsession1 as "ai.newSession" }