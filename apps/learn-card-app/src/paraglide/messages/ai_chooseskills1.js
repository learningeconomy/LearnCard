/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Chooseskills1Inputs */

const en_ai_chooseskills1 = /** @type {(inputs: Ai_Chooseskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose your current skills`)
};

const es_ai_chooseskills1 = /** @type {(inputs: Ai_Chooseskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige tus habilidades actuales`)
};

const fr_ai_chooseskills1 = /** @type {(inputs: Ai_Chooseskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez vos compétences actuelles`)
};

const ar_ai_chooseskills1 = /** @type {(inputs: Ai_Chooseskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر مهاراتك الحالية`)
};

/**
* | output |
* | --- |
* | "Choose your current skills" |
*
* @param {Ai_Chooseskills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_chooseskills1 = /** @type {((inputs?: Ai_Chooseskills1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Chooseskills1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_chooseskills1(inputs)
	if (locale === "es") return es_ai_chooseskills1(inputs)
	if (locale === "fr") return fr_ai_chooseskills1(inputs)
	return ar_ai_chooseskills1(inputs)
});
export { ai_chooseskills1 as "ai.chooseSkills" }