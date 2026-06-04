/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Sharesession1Inputs */

const en_ai_sharesession1 = /** @type {(inputs: Ai_Sharesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share`)
};

const es_ai_sharesession1 = /** @type {(inputs: Ai_Sharesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir`)
};

const de_ai_sharesession1 = /** @type {(inputs: Ai_Sharesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Teilen`)
};

const ar_ai_sharesession1 = /** @type {(inputs: Ai_Sharesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة`)
};

const fr_ai_sharesession1 = /** @type {(inputs: Ai_Sharesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager`)
};

const ko_ai_sharesession1 = /** @type {(inputs: Ai_Sharesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`공유`)
};

/**
* | output |
* | --- |
* | "Share" |
*
* @param {Ai_Sharesession1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_sharesession1 = /** @type {((inputs?: Ai_Sharesession1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Sharesession1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_sharesession1(inputs)
	if (locale === "es") return es_ai_sharesession1(inputs)
	if (locale === "de") return de_ai_sharesession1(inputs)
	if (locale === "ar") return ar_ai_sharesession1(inputs)
	if (locale === "fr") return fr_ai_sharesession1(inputs)
	return ko_ai_sharesession1(inputs)
});
export { ai_sharesession1 as "ai.shareSession" }