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

const de_ai_title = /** @type {(inputs: Ai_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`KI`)
};

const ar_ai_title = /** @type {(inputs: Ai_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الذكاء الاصطناعي`)
};

const fr_ai_title = /** @type {(inputs: Ai_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA`)
};

const ko_ai_title = /** @type {(inputs: Ai_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI`)
};

/**
* | output |
* | --- |
* | "AI" |
*
* @param {Ai_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_title = /** @type {((inputs?: Ai_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_title(inputs)
	if (locale === "es") return es_ai_title(inputs)
	if (locale === "de") return de_ai_title(inputs)
	if (locale === "ar") return ar_ai_title(inputs)
	if (locale === "fr") return fr_ai_title(inputs)
	return ko_ai_title(inputs)
});
export { ai_title as "ai.title" }