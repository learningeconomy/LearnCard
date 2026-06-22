/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Matchingskill1Inputs */

const en_ai_matchingskill1 = /** @type {(inputs: Ai_Matchingskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Matching Skill`)
};

const es_ai_matchingskill1 = /** @type {(inputs: Ai_Matchingskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidad coincidente`)
};

const fr_ai_matchingskill1 = /** @type {(inputs: Ai_Matchingskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétence correspondante`)
};

const ar_ai_matchingskill1 = /** @type {(inputs: Ai_Matchingskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارة مطابقة`)
};

/**
* | output |
* | --- |
* | "Matching Skill" |
*
* @param {Ai_Matchingskill1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_matchingskill1 = /** @type {((inputs?: Ai_Matchingskill1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Matchingskill1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_matchingskill1(inputs)
	if (locale === "es") return es_ai_matchingskill1(inputs)
	if (locale === "fr") return fr_ai_matchingskill1(inputs)
	return ar_ai_matchingskill1(inputs)
});
export { ai_matchingskill1 as "ai.matchingSkill" }