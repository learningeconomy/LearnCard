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

const de_toasts_resume_verifiedresumelinkcopied3 = /** @type {(inputs: Toasts_Resume_Verifiedresumelinkcopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifizierter Lebenslauf-Link in die Zwischenablage kopiert`)
};

const ar_toasts_resume_verifiedresumelinkcopied3 = /** @type {(inputs: Toasts_Resume_Verifiedresumelinkcopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط السيرة الذاتية المعتمدة إلى الحافظة`)
};

const fr_toasts_resume_verifiedresumelinkcopied3 = /** @type {(inputs: Toasts_Resume_Verifiedresumelinkcopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien de CV vérifié copié dans le presse-papiers`)
};

const ko_toasts_resume_verifiedresumelinkcopied3 = /** @type {(inputs: Toasts_Resume_Verifiedresumelinkcopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`검증된 이력서 링크가 클립보드에 복사됨`)
};

/**
* | output |
* | --- |
* | "Verified resume link copied to clipboard" |
*
* @param {Toasts_Resume_Verifiedresumelinkcopied3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_resume_verifiedresumelinkcopied3 = /** @type {((inputs?: Toasts_Resume_Verifiedresumelinkcopied3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Verifiedresumelinkcopied3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_verifiedresumelinkcopied3(inputs)
	if (locale === "es") return es_toasts_resume_verifiedresumelinkcopied3(inputs)
	if (locale === "de") return de_toasts_resume_verifiedresumelinkcopied3(inputs)
	if (locale === "ar") return ar_toasts_resume_verifiedresumelinkcopied3(inputs)
	if (locale === "fr") return fr_toasts_resume_verifiedresumelinkcopied3(inputs)
	return ko_toasts_resume_verifiedresumelinkcopied3(inputs)
});
export { toasts_resume_verifiedresumelinkcopied3 as "toasts.resume.verifiedResumeLinkCopied" }