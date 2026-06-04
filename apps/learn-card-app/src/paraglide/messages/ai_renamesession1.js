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

const de_ai_renamesession1 = /** @type {(inputs: Ai_Renamesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Umbenennen`)
};

const ar_ai_renamesession1 = /** @type {(inputs: Ai_Renamesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة تسمية`)
};

const fr_ai_renamesession1 = /** @type {(inputs: Ai_Renamesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renommer`)
};

const ko_ai_renamesession1 = /** @type {(inputs: Ai_Renamesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이름 변경`)
};

/**
* | output |
* | --- |
* | "Rename" |
*
* @param {Ai_Renamesession1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_renamesession1 = /** @type {((inputs?: Ai_Renamesession1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Renamesession1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_renamesession1(inputs)
	if (locale === "es") return es_ai_renamesession1(inputs)
	if (locale === "de") return de_ai_renamesession1(inputs)
	if (locale === "ar") return ar_ai_renamesession1(inputs)
	if (locale === "fr") return fr_ai_renamesession1(inputs)
	return ko_ai_renamesession1(inputs)
});
export { ai_renamesession1 as "ai.renameSession" }