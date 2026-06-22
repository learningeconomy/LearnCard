/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_UnfinishedInputs */

const en_ai_unfinished = /** @type {(inputs: Ai_UnfinishedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unfinished`)
};

const es_ai_unfinished = /** @type {(inputs: Ai_UnfinishedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inacabada`)
};

const fr_ai_unfinished = /** @type {(inputs: Ai_UnfinishedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inachevé`)
};

const ar_ai_unfinished = /** @type {(inputs: Ai_UnfinishedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير مكتمل`)
};

/**
* | output |
* | --- |
* | "Unfinished" |
*
* @param {Ai_UnfinishedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_unfinished = /** @type {((inputs?: Ai_UnfinishedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_UnfinishedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_unfinished(inputs)
	if (locale === "es") return es_ai_unfinished(inputs)
	if (locale === "fr") return fr_ai_unfinished(inputs)
	return ar_ai_unfinished(inputs)
});
export { ai_unfinished as "ai.unfinished" }