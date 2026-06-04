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

const de_toasts_resume_selfissuenoprofile3 = /** @type {(inputs: Toasts_Resume_Selfissuenoprofile3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selbstausstellung ohne Profil nicht möglich.`)
};

const ar_toasts_resume_selfissuenoprofile3 = /** @type {(inputs: Toasts_Resume_Selfissuenoprofile3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر الإصدار الذاتي بدون ملف شخصي.`)
};

const fr_toasts_resume_selfissuenoprofile3 = /** @type {(inputs: Toasts_Resume_Selfissuenoprofile3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'auto-émettre sans profil.`)
};

const ko_toasts_resume_selfissuenoprofile3 = /** @type {(inputs: Toasts_Resume_Selfissuenoprofile3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필 없이 자체 발행할 수 없습니다.`)
};

/**
* | output |
* | --- |
* | "Unable to self issue without a profile." |
*
* @param {Toasts_Resume_Selfissuenoprofile3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_resume_selfissuenoprofile3 = /** @type {((inputs?: Toasts_Resume_Selfissuenoprofile3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Selfissuenoprofile3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_selfissuenoprofile3(inputs)
	if (locale === "es") return es_toasts_resume_selfissuenoprofile3(inputs)
	if (locale === "de") return de_toasts_resume_selfissuenoprofile3(inputs)
	if (locale === "ar") return ar_toasts_resume_selfissuenoprofile3(inputs)
	if (locale === "fr") return fr_toasts_resume_selfissuenoprofile3(inputs)
	return ko_toasts_resume_selfissuenoprofile3(inputs)
});
export { toasts_resume_selfissuenoprofile3 as "toasts.resume.selfIssueNoProfile" }