/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Verifiedresumelinkcopied3Inputs */

const en_toasts_resume_verifiedresumelinkcopied3 = /** @type {(inputs: Toasts_Resume_Verifiedresumelinkcopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verified resume link copied to clipboard`)
};

const es_toasts_resume_verifiedresumelinkcopied3 = /** @type {(inputs: Toasts_Resume_Verifiedresumelinkcopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace de currículum verificado copiado al portapapeles`)
};

const fr_toasts_resume_verifiedresumelinkcopied3 = /** @type {(inputs: Toasts_Resume_Verifiedresumelinkcopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien de CV vérifié copié dans le presse-papiers`)
};

const ar_toasts_resume_verifiedresumelinkcopied3 = /** @type {(inputs: Toasts_Resume_Verifiedresumelinkcopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط السيرة الذاتية المعتمدة إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Verified resume link copied to clipboard" |
*
* @param {Toasts_Resume_Verifiedresumelinkcopied3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_resume_verifiedresumelinkcopied3 = /** @type {((inputs?: Toasts_Resume_Verifiedresumelinkcopied3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Verifiedresumelinkcopied3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_verifiedresumelinkcopied3(inputs)
	if (locale === "es") return es_toasts_resume_verifiedresumelinkcopied3(inputs)
	if (locale === "fr") return fr_toasts_resume_verifiedresumelinkcopied3(inputs)
	return ar_toasts_resume_verifiedresumelinkcopied3(inputs)
});
export { toasts_resume_verifiedresumelinkcopied3 as "toasts.resume.verifiedResumeLinkCopied" }