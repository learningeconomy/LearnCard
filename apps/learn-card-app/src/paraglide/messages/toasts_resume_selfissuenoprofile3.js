/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Selfissuenoprofile3Inputs */

const en_toasts_resume_selfissuenoprofile3 = /** @type {(inputs: Toasts_Resume_Selfissuenoprofile3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to self issue without a profile.`)
};

const es_toasts_resume_selfissuenoprofile3 = /** @type {(inputs: Toasts_Resume_Selfissuenoprofile3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se puede emitir sin un perfil.`)
};

const fr_toasts_resume_selfissuenoprofile3 = /** @type {(inputs: Toasts_Resume_Selfissuenoprofile3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'auto-émettre sans profil.`)
};

const ar_toasts_resume_selfissuenoprofile3 = /** @type {(inputs: Toasts_Resume_Selfissuenoprofile3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر الإصدار الذاتي بدون ملف شخصي.`)
};

/**
* | output |
* | --- |
* | "Unable to self issue without a profile." |
*
* @param {Toasts_Resume_Selfissuenoprofile3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_resume_selfissuenoprofile3 = /** @type {((inputs?: Toasts_Resume_Selfissuenoprofile3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Selfissuenoprofile3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_selfissuenoprofile3(inputs)
	if (locale === "es") return es_toasts_resume_selfissuenoprofile3(inputs)
	if (locale === "fr") return fr_toasts_resume_selfissuenoprofile3(inputs)
	return ar_toasts_resume_selfissuenoprofile3(inputs)
});
export { toasts_resume_selfissuenoprofile3 as "toasts.resume.selfIssueNoProfile" }