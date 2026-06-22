/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_TitleInputs */

const en_ai_title = /** @type {(inputs: Ai_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI`)
};

const es_ai_title = /** @type {(inputs: Ai_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA`)
};

const fr_ai_title = /** @type {(inputs: Ai_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA`)
};

const ar_ai_title = /** @type {(inputs: Ai_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI" |
*
* @param {Ai_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_title = /** @type {((inputs?: Ai_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_title(inputs)
	if (locale === "es") return es_ai_title(inputs)
	if (locale === "fr") return fr_ai_title(inputs)
	return ar_ai_title(inputs)
});
export { ai_title as "ai.title" }