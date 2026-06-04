/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Manageskills1Inputs */

const en_ai_manageskills1 = /** @type {(inputs: Ai_Manageskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage your current skills`)
};

const es_ai_manageskills1 = /** @type {(inputs: Ai_Manageskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestiona tus habilidades actuales`)
};

const de_ai_manageskills1 = /** @type {(inputs: Ai_Manageskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verwalte deine aktuellen Fähigkeiten`)
};

const ar_ai_manageskills1 = /** @type {(inputs: Ai_Manageskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدر مهاراتك الحالية`)
};

const fr_ai_manageskills1 = /** @type {(inputs: Ai_Manageskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérez vos compétences actuelles`)
};

const ko_ai_manageskills1 = /** @type {(inputs: Ai_Manageskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`현재 기술 관리`)
};

/**
* | output |
* | --- |
* | "Manage your current skills" |
*
* @param {Ai_Manageskills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_manageskills1 = /** @type {((inputs?: Ai_Manageskills1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Manageskills1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_manageskills1(inputs)
	if (locale === "es") return es_ai_manageskills1(inputs)
	if (locale === "de") return de_ai_manageskills1(inputs)
	if (locale === "ar") return ar_ai_manageskills1(inputs)
	if (locale === "fr") return fr_ai_manageskills1(inputs)
	return ko_ai_manageskills1(inputs)
});
export { ai_manageskills1 as "ai.manageSkills" }