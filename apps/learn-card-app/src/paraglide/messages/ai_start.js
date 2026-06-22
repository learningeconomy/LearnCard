/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_StartInputs */

const en_ai_start = /** @type {(inputs: Ai_StartInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Start`)
};

const es_ai_start = /** @type {(inputs: Ai_StartInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comenzar`)
};

const fr_ai_start = /** @type {(inputs: Ai_StartInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Commencer`)
};

const ar_ai_start = /** @type {(inputs: Ai_StartInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابدأ`)
};

/**
* | output |
* | --- |
* | "Start" |
*
* @param {Ai_StartInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_start = /** @type {((inputs?: Ai_StartInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_StartInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_start(inputs)
	if (locale === "es") return es_ai_start(inputs)
	if (locale === "fr") return fr_ai_start(inputs)
	return ar_ai_start(inputs)
});
export { ai_start as "ai.start" }