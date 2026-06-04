/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Skills_Filljobtitle2Inputs */

const en_toasts_skills_filljobtitle2 = /** @type {(inputs: Toasts_Skills_Filljobtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please fill in job title and employer`)
};

const es_toasts_skills_filljobtitle2 = /** @type {(inputs: Toasts_Skills_Filljobtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor, completa el puesto y el empleador`)
};

const de_toasts_skills_filljobtitle2 = /** @type {(inputs: Toasts_Skills_Filljobtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bitte gib die Position und den Arbeitgeber an`)
};

const ar_toasts_skills_filljobtitle2 = /** @type {(inputs: Toasts_Skills_Filljobtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى ملء المسمى الوظيفي واسم صاحب العمل`)
};

const fr_toasts_skills_filljobtitle2 = /** @type {(inputs: Toasts_Skills_Filljobtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez remplir le poste et l'employeur`)
};

const ko_toasts_skills_filljobtitle2 = /** @type {(inputs: Toasts_Skills_Filljobtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`직책 및 고용주를 입력해 주세요`)
};

/**
* | output |
* | --- |
* | "Please fill in job title and employer" |
*
* @param {Toasts_Skills_Filljobtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_skills_filljobtitle2 = /** @type {((inputs?: Toasts_Skills_Filljobtitle2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Filljobtitle2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_filljobtitle2(inputs)
	if (locale === "es") return es_toasts_skills_filljobtitle2(inputs)
	if (locale === "de") return de_toasts_skills_filljobtitle2(inputs)
	if (locale === "ar") return ar_toasts_skills_filljobtitle2(inputs)
	if (locale === "fr") return fr_toasts_skills_filljobtitle2(inputs)
	return ko_toasts_skills_filljobtitle2(inputs)
});
export { toasts_skills_filljobtitle2 as "toasts.skills.fillJobTitle" }