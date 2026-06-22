/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Revisittopic1Inputs */

const en_ai_revisittopic1 = /** @type {(inputs: Ai_Revisittopic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisit Topic`)
};

const es_ai_revisittopic1 = /** @type {(inputs: Ai_Revisittopic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisitar tema`)
};

const fr_ai_revisittopic1 = /** @type {(inputs: Ai_Revisittopic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revoir le sujet`)
};

const ar_ai_revisittopic1 = /** @type {(inputs: Ai_Revisittopic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة زيارة الموضوع`)
};

/**
* | output |
* | --- |
* | "Revisit Topic" |
*
* @param {Ai_Revisittopic1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_revisittopic1 = /** @type {((inputs?: Ai_Revisittopic1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Revisittopic1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_revisittopic1(inputs)
	if (locale === "es") return es_ai_revisittopic1(inputs)
	if (locale === "fr") return fr_ai_revisittopic1(inputs)
	return ar_ai_revisittopic1(inputs)
});
export { ai_revisittopic1 as "ai.revisitTopic" }