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

const de_ai_browsetopics1 = /** @type {(inputs: Ai_Browsetopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sitzungen durchsuchen...`)
};

const ar_ai_browsetopics1 = /** @type {(inputs: Ai_Browsetopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفح الجلسات...`)
};

const fr_ai_browsetopics1 = /** @type {(inputs: Ai_Browsetopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcourir les sessions...`)
};

const ko_ai_browsetopics1 = /** @type {(inputs: Ai_Browsetopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`세션 탐색...`)
};

/**
* | output |
* | --- |
* | "Browse sessions..." |
*
* @param {Ai_Browsetopics1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_browsetopics1 = /** @type {((inputs?: Ai_Browsetopics1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Browsetopics1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_browsetopics1(inputs)
	if (locale === "es") return es_ai_browsetopics1(inputs)
	if (locale === "de") return de_ai_browsetopics1(inputs)
	if (locale === "ar") return ar_ai_browsetopics1(inputs)
	if (locale === "fr") return fr_ai_browsetopics1(inputs)
	return ko_ai_browsetopics1(inputs)
});
export { ai_browsetopics1 as "ai.browseTopics" }