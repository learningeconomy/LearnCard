/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Browsetopics1Inputs */

const en_ai_browsetopics1 = /** @type {(inputs: Ai_Browsetopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse sessions...`)
};

const es_ai_browsetopics1 = /** @type {(inputs: Ai_Browsetopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar sesiones...`)
};

const fr_ai_browsetopics1 = /** @type {(inputs: Ai_Browsetopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcourir les sessions...`)
};

const ar_ai_browsetopics1 = /** @type {(inputs: Ai_Browsetopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفح الجلسات...`)
};

/**
* | output |
* | --- |
* | "Browse sessions..." |
*
* @param {Ai_Browsetopics1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_browsetopics1 = /** @type {((inputs?: Ai_Browsetopics1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Browsetopics1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_browsetopics1(inputs)
	if (locale === "es") return es_ai_browsetopics1(inputs)
	if (locale === "fr") return fr_ai_browsetopics1(inputs)
	return ar_ai_browsetopics1(inputs)
});
export { ai_browsetopics1 as "ai.browseTopics" }