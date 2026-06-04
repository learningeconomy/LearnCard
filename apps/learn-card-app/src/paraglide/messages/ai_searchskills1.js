/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Searchskills1Inputs */

const en_ai_searchskills1 = /** @type {(inputs: Ai_Searchskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose a skill, goal, or job...`)
};

const es_ai_searchskills1 = /** @type {(inputs: Ai_Searchskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige una habilidad, objetivo o trabajo...`)
};

const de_ai_searchskills1 = /** @type {(inputs: Ai_Searchskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wähle eine Fähigkeit, ein Ziel oder einen Beruf...`)
};

const ar_ai_searchskills1 = /** @type {(inputs: Ai_Searchskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر مهارة أو هدفاً أو وظيفة...`)
};

const fr_ai_searchskills1 = /** @type {(inputs: Ai_Searchskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez une compétence, un objectif ou un métier...`)
};

const ko_ai_searchskills1 = /** @type {(inputs: Ai_Searchskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기술, 목표 또는 직업을 선택하세요...`)
};

/**
* | output |
* | --- |
* | "Choose a skill, goal, or job..." |
*
* @param {Ai_Searchskills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_searchskills1 = /** @type {((inputs?: Ai_Searchskills1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Searchskills1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_searchskills1(inputs)
	if (locale === "es") return es_ai_searchskills1(inputs)
	if (locale === "de") return de_ai_searchskills1(inputs)
	if (locale === "ar") return ar_ai_searchskills1(inputs)
	if (locale === "fr") return fr_ai_searchskills1(inputs)
	return ko_ai_searchskills1(inputs)
});
export { ai_searchskills1 as "ai.searchSkills" }