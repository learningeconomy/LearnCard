/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Matchingskills1Inputs */

const en_ai_matchingskills1 = /** @type {(inputs: Ai_Matchingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Matching Skills`)
};

const es_ai_matchingskills1 = /** @type {(inputs: Ai_Matchingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades coincidentes`)
};

const fr_ai_matchingskills1 = /** @type {(inputs: Ai_Matchingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences correspondantes`)
};

const ar_ai_matchingskills1 = /** @type {(inputs: Ai_Matchingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارات مطابقة`)
};

/**
* | output |
* | --- |
* | "Matching Skills" |
*
* @param {Ai_Matchingskills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_matchingskills1 = /** @type {((inputs?: Ai_Matchingskills1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Matchingskills1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_matchingskills1(inputs)
	if (locale === "es") return es_ai_matchingskills1(inputs)
	if (locale === "fr") return fr_ai_matchingskills1(inputs)
	return ar_ai_matchingskills1(inputs)
});
export { ai_matchingskills1 as "ai.matchingSkills" }