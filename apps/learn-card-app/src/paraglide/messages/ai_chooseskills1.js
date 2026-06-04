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

const de_ai_chooseskills1 = /** @type {(inputs: Ai_Chooseskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wähle deine aktuellen Fähigkeiten`)
};

const ar_ai_chooseskills1 = /** @type {(inputs: Ai_Chooseskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر مهاراتك الحالية`)
};

const fr_ai_chooseskills1 = /** @type {(inputs: Ai_Chooseskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez vos compétences actuelles`)
};

const ko_ai_chooseskills1 = /** @type {(inputs: Ai_Chooseskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`현재 기술 선택`)
};

/**
* | output |
* | --- |
* | "Choose your current skills" |
*
* @param {Ai_Chooseskills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_chooseskills1 = /** @type {((inputs?: Ai_Chooseskills1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Chooseskills1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_chooseskills1(inputs)
	if (locale === "es") return es_ai_chooseskills1(inputs)
	if (locale === "de") return de_ai_chooseskills1(inputs)
	if (locale === "ar") return ar_ai_chooseskills1(inputs)
	if (locale === "fr") return fr_ai_chooseskills1(inputs)
	return ko_ai_chooseskills1(inputs)
});
export { ai_chooseskills1 as "ai.chooseSkills" }