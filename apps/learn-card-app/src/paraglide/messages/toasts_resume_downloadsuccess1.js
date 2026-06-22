/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Downloadsuccess1Inputs */

const en_toasts_resume_downloadsuccess1 = /** @type {(inputs: Toasts_Resume_Downloadsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resume downloaded successfully.`)
};

const es_toasts_resume_downloadsuccess1 = /** @type {(inputs: Toasts_Resume_Downloadsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Currículum descargado exitosamente.`)
};

const fr_toasts_resume_downloadsuccess1 = /** @type {(inputs: Toasts_Resume_Downloadsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CV téléchargé avec succès.`)
};

const ar_toasts_resume_downloadsuccess1 = /** @type {(inputs: Toasts_Resume_Downloadsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تنزيل السيرة الذاتية بنجاح.`)
};

/**
* | output |
* | --- |
* | "Resume downloaded successfully." |
*
* @param {Toasts_Resume_Downloadsuccess1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_resume_downloadsuccess1 = /** @type {((inputs?: Toasts_Resume_Downloadsuccess1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Downloadsuccess1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_downloadsuccess1(inputs)
	if (locale === "es") return es_toasts_resume_downloadsuccess1(inputs)
	if (locale === "fr") return fr_toasts_resume_downloadsuccess1(inputs)
	return ar_toasts_resume_downloadsuccess1(inputs)
});
export { toasts_resume_downloadsuccess1 as "toasts.resume.downloadSuccess" }