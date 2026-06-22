/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Alltopics1Inputs */

const en_ai_alltopics1 = /** @type {(inputs: Ai_Alltopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All Topics`)
};

const es_ai_alltopics1 = /** @type {(inputs: Ai_Alltopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos los temas`)
};

const fr_ai_alltopics1 = /** @type {(inputs: Ai_Alltopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous les sujets`)
};

const ar_ai_alltopics1 = /** @type {(inputs: Ai_Alltopics1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جميع المواضيع`)
};

/**
* | output |
* | --- |
* | "All Topics" |
*
* @param {Ai_Alltopics1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_alltopics1 = /** @type {((inputs?: Ai_Alltopics1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Alltopics1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_alltopics1(inputs)
	if (locale === "es") return es_ai_alltopics1(inputs)
	if (locale === "fr") return fr_ai_alltopics1(inputs)
	return ar_ai_alltopics1(inputs)
});
export { ai_alltopics1 as "ai.allTopics" }