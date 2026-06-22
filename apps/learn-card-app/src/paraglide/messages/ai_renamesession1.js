/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Renamesession1Inputs */

const en_ai_renamesession1 = /** @type {(inputs: Ai_Renamesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rename`)
};

const es_ai_renamesession1 = /** @type {(inputs: Ai_Renamesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renombrar`)
};

const fr_ai_renamesession1 = /** @type {(inputs: Ai_Renamesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renommer`)
};

const ar_ai_renamesession1 = /** @type {(inputs: Ai_Renamesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة تسمية`)
};

/**
* | output |
* | --- |
* | "Rename" |
*
* @param {Ai_Renamesession1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_renamesession1 = /** @type {((inputs?: Ai_Renamesession1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Renamesession1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_renamesession1(inputs)
	if (locale === "es") return es_ai_renamesession1(inputs)
	if (locale === "fr") return fr_ai_renamesession1(inputs)
	return ar_ai_renamesession1(inputs)
});
export { ai_renamesession1 as "ai.renameSession" }