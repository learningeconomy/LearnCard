/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Notavailabletoshare3Inputs */

const en_toasts_resume_notavailabletoshare3 = /** @type {(inputs: Toasts_Resume_Notavailabletoshare3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This resume is not available to share yet.`)
};

const es_toasts_resume_notavailabletoshare3 = /** @type {(inputs: Toasts_Resume_Notavailabletoshare3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Este currículum aún no está disponible para compartir.`)
};

const fr_toasts_resume_notavailabletoshare3 = /** @type {(inputs: Toasts_Resume_Notavailabletoshare3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce CV n'est pas encore disponible pour le partage.`)
};

const ar_toasts_resume_notavailabletoshare3 = /** @type {(inputs: Toasts_Resume_Notavailabletoshare3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هذه السيرة الذاتية غير متاحة للمشاركة بعد.`)
};

/**
* | output |
* | --- |
* | "This resume is not available to share yet." |
*
* @param {Toasts_Resume_Notavailabletoshare3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_resume_notavailabletoshare3 = /** @type {((inputs?: Toasts_Resume_Notavailabletoshare3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Notavailabletoshare3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_notavailabletoshare3(inputs)
	if (locale === "es") return es_toasts_resume_notavailabletoshare3(inputs)
	if (locale === "fr") return fr_toasts_resume_notavailabletoshare3(inputs)
	return ar_toasts_resume_notavailabletoshare3(inputs)
});
export { toasts_resume_notavailabletoshare3 as "toasts.resume.notAvailableToShare" }