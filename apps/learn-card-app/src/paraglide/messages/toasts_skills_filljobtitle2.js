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

const fr_toasts_skills_filljobtitle2 = /** @type {(inputs: Toasts_Skills_Filljobtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez remplir le poste et l'employeur`)
};

const ar_toasts_skills_filljobtitle2 = /** @type {(inputs: Toasts_Skills_Filljobtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى ملء المسمى الوظيفي واسم صاحب العمل`)
};

/**
* | output |
* | --- |
* | "Please fill in job title and employer" |
*
* @param {Toasts_Skills_Filljobtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_skills_filljobtitle2 = /** @type {((inputs?: Toasts_Skills_Filljobtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Filljobtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_filljobtitle2(inputs)
	if (locale === "es") return es_toasts_skills_filljobtitle2(inputs)
	if (locale === "fr") return fr_toasts_skills_filljobtitle2(inputs)
	return ar_toasts_skills_filljobtitle2(inputs)
});
export { toasts_skills_filljobtitle2 as "toasts.skills.fillJobTitle" }