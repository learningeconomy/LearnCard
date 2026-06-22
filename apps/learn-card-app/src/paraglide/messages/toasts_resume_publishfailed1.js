/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Publishfailed1Inputs */

const en_toasts_resume_publishfailed1 = /** @type {(inputs: Toasts_Resume_Publishfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to publish LER-RS resume credential.`)
};

const es_toasts_resume_publishfailed1 = /** @type {(inputs: Toasts_Resume_Publishfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al publicar la credencial de currículum LER-RS.`)
};

const fr_toasts_resume_publishfailed1 = /** @type {(inputs: Toasts_Resume_Publishfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la publication de l'accréditation de cv LER-RS.`)
};

const ar_toasts_resume_publishfailed1 = /** @type {(inputs: Toasts_Resume_Publishfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل نشر بيانات اعتماد السيرة الذاتية LER-RS.`)
};

/**
* | output |
* | --- |
* | "Failed to publish LER-RS resume credential." |
*
* @param {Toasts_Resume_Publishfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_resume_publishfailed1 = /** @type {((inputs?: Toasts_Resume_Publishfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Publishfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_publishfailed1(inputs)
	if (locale === "es") return es_toasts_resume_publishfailed1(inputs)
	if (locale === "fr") return fr_toasts_resume_publishfailed1(inputs)
	return ar_toasts_resume_publishfailed1(inputs)
});
export { toasts_resume_publishfailed1 as "toasts.resume.publishFailed" }