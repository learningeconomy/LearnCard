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

const de_ai_matchingskills1 = /** @type {(inputs: Ai_Matchingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Übereinstimmende Fähigkeiten`)
};

const ar_ai_matchingskills1 = /** @type {(inputs: Ai_Matchingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارات مطابقة`)
};

const fr_ai_matchingskills1 = /** @type {(inputs: Ai_Matchingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences correspondantes`)
};

const ko_ai_matchingskills1 = /** @type {(inputs: Ai_Matchingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`일치하는 기술`)
};

/**
* | output |
* | --- |
* | "Matching Skills" |
*
* @param {Ai_Matchingskills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_matchingskills1 = /** @type {((inputs?: Ai_Matchingskills1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Matchingskills1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_matchingskills1(inputs)
	if (locale === "es") return es_ai_matchingskills1(inputs)
	if (locale === "de") return de_ai_matchingskills1(inputs)
	if (locale === "ar") return ar_ai_matchingskills1(inputs)
	if (locale === "fr") return fr_ai_matchingskills1(inputs)
	return ko_ai_matchingskills1(inputs)
});
export { ai_matchingskills1 as "ai.matchingSkills" }