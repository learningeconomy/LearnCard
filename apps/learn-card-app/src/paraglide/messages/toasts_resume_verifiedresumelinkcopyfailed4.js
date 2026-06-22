/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Verifiedresumelinkcopyfailed4Inputs */

const en_toasts_resume_verifiedresumelinkcopyfailed4 = /** @type {(inputs: Toasts_Resume_Verifiedresumelinkcopyfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy verified resume link to clipboard`)
};

const es_toasts_resume_verifiedresumelinkcopyfailed4 = /** @type {(inputs: Toasts_Resume_Verifiedresumelinkcopyfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace de currículum verificado`)
};

const fr_toasts_resume_verifiedresumelinkcopyfailed4 = /** @type {(inputs: Toasts_Resume_Verifiedresumelinkcopyfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien de CV vérifié`)
};

const ar_toasts_resume_verifiedresumelinkcopyfailed4 = /** @type {(inputs: Toasts_Resume_Verifiedresumelinkcopyfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ رابط السيرة الذاتية المعتمدة`)
};

/**
* | output |
* | --- |
* | "Unable to copy verified resume link to clipboard" |
*
* @param {Toasts_Resume_Verifiedresumelinkcopyfailed4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_resume_verifiedresumelinkcopyfailed4 = /** @type {((inputs?: Toasts_Resume_Verifiedresumelinkcopyfailed4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Verifiedresumelinkcopyfailed4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_verifiedresumelinkcopyfailed4(inputs)
	if (locale === "es") return es_toasts_resume_verifiedresumelinkcopyfailed4(inputs)
	if (locale === "fr") return fr_toasts_resume_verifiedresumelinkcopyfailed4(inputs)
	return ar_toasts_resume_verifiedresumelinkcopyfailed4(inputs)
});
export { toasts_resume_verifiedresumelinkcopyfailed4 as "toasts.resume.verifiedResumeLinkCopyFailed" }