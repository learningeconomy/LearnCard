/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Mostrecent1Inputs */

const en_ai_mostrecent1 = /** @type {(inputs: Ai_Mostrecent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Most Recent`)
};

const es_ai_mostrecent1 = /** @type {(inputs: Ai_Mostrecent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Más reciente`)
};

const fr_ai_mostrecent1 = /** @type {(inputs: Ai_Mostrecent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plus récent`)
};

const ar_ai_mostrecent1 = /** @type {(inputs: Ai_Mostrecent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأحدث`)
};

/**
* | output |
* | --- |
* | "Most Recent" |
*
* @param {Ai_Mostrecent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_mostrecent1 = /** @type {((inputs?: Ai_Mostrecent1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Mostrecent1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_mostrecent1(inputs)
	if (locale === "es") return es_ai_mostrecent1(inputs)
	if (locale === "fr") return fr_ai_mostrecent1(inputs)
	return ar_ai_mostrecent1(inputs)
});
export { ai_mostrecent1 as "ai.mostRecent" }