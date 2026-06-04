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

const de_ai_matchingskill1 = /** @type {(inputs: Ai_Matchingskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Übereinstimmende Fähigkeit`)
};

const ar_ai_matchingskill1 = /** @type {(inputs: Ai_Matchingskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارة مطابقة`)
};

const fr_ai_matchingskill1 = /** @type {(inputs: Ai_Matchingskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétence correspondante`)
};

const ko_ai_matchingskill1 = /** @type {(inputs: Ai_Matchingskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`일치하는 기술`)
};

/**
* | output |
* | --- |
* | "Matching Skill" |
*
* @param {Ai_Matchingskill1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_matchingskill1 = /** @type {((inputs?: Ai_Matchingskill1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Matchingskill1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_matchingskill1(inputs)
	if (locale === "es") return es_ai_matchingskill1(inputs)
	if (locale === "de") return de_ai_matchingskill1(inputs)
	if (locale === "ar") return ar_ai_matchingskill1(inputs)
	if (locale === "fr") return fr_ai_matchingskill1(inputs)
	return ko_ai_matchingskill1(inputs)
});
export { ai_matchingskill1 as "ai.matchingSkill" }