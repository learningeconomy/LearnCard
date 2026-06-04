/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Skills_Suggestionthanks1Inputs */

const en_toasts_skills_suggestionthanks1 = /** @type {(inputs: Toasts_Skills_Suggestionthanks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Thank you for your suggestion!`)
};

const es_toasts_skills_suggestionthanks1 = /** @type {(inputs: Toasts_Skills_Suggestionthanks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Gracias por tu sugerencia!`)
};

const de_toasts_skills_suggestionthanks1 = /** @type {(inputs: Toasts_Skills_Suggestionthanks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Danke für deinen Vorschlag!`)
};

const ar_toasts_skills_suggestionthanks1 = /** @type {(inputs: Toasts_Skills_Suggestionthanks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شكراً على اقتراحك!`)
};

const fr_toasts_skills_suggestionthanks1 = /** @type {(inputs: Toasts_Skills_Suggestionthanks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Merci pour votre suggestion !`)
};

const ko_toasts_skills_suggestionthanks1 = /** @type {(inputs: Toasts_Skills_Suggestionthanks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`제안해 주셔서 감사합니다!`)
};

/**
* | output |
* | --- |
* | "Thank you for your suggestion!" |
*
* @param {Toasts_Skills_Suggestionthanks1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_skills_suggestionthanks1 = /** @type {((inputs?: Toasts_Skills_Suggestionthanks1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Suggestionthanks1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_suggestionthanks1(inputs)
	if (locale === "es") return es_toasts_skills_suggestionthanks1(inputs)
	if (locale === "de") return de_toasts_skills_suggestionthanks1(inputs)
	if (locale === "ar") return ar_toasts_skills_suggestionthanks1(inputs)
	if (locale === "fr") return fr_toasts_skills_suggestionthanks1(inputs)
	return ko_toasts_skills_suggestionthanks1(inputs)
});
export { toasts_skills_suggestionthanks1 as "toasts.skills.suggestionThanks" }