/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Notopics1Inputs */

const en_ai_notopics1 = /** @type {(inputs: Ai_Notopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No topics yet`)
};

const es_ai_notopics1 = /** @type {(inputs: Ai_Notopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay temas`)
};

const fr_ai_notopics1 = /** @type {(inputs: Ai_Notopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun sujet pour le moment`)
};

const ar_ai_notopics1 = /** @type {(inputs: Ai_Notopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد مواضيع بعد`)
};

/**
* | output |
* | --- |
* | "No topics yet" |
*
* @param {Ai_Notopics1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_notopics1 = /** @type {((inputs?: Ai_Notopics1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Notopics1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_notopics1(inputs)
	if (locale === "es") return es_ai_notopics1(inputs)
	if (locale === "fr") return fr_ai_notopics1(inputs)
	return ar_ai_notopics1(inputs)
});
export { ai_notopics1 as "ai.noTopics" }