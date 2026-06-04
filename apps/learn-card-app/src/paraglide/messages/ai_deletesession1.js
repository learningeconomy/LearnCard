/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Deletesession1Inputs */

const en_ai_deletesession1 = /** @type {(inputs: Ai_Deletesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete`)
};

const es_ai_deletesession1 = /** @type {(inputs: Ai_Deletesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const de_ai_deletesession1 = /** @type {(inputs: Ai_Deletesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Löschen`)
};

const ar_ai_deletesession1 = /** @type {(inputs: Ai_Deletesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف`)
};

const fr_ai_deletesession1 = /** @type {(inputs: Ai_Deletesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

const ko_ai_deletesession1 = /** @type {(inputs: Ai_Deletesession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`삭제`)
};

/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Ai_Deletesession1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_deletesession1 = /** @type {((inputs?: Ai_Deletesession1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Deletesession1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_deletesession1(inputs)
	if (locale === "es") return es_ai_deletesession1(inputs)
	if (locale === "de") return de_ai_deletesession1(inputs)
	if (locale === "ar") return ar_ai_deletesession1(inputs)
	if (locale === "fr") return fr_ai_deletesession1(inputs)
	return ko_ai_deletesession1(inputs)
});
export { ai_deletesession1 as "ai.deleteSession" }