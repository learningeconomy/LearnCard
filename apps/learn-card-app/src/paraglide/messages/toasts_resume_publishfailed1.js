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

const de_toasts_resume_publishfailed1 = /** @type {(inputs: Toasts_Resume_Publishfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veröffentlichung der LER-RS-Lebenslauf-Berechtigung fehlgeschlagen.`)
};

const ar_toasts_resume_publishfailed1 = /** @type {(inputs: Toasts_Resume_Publishfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل نشر بيانات اعتماد السيرة الذاتية LER-RS.`)
};

const fr_toasts_resume_publishfailed1 = /** @type {(inputs: Toasts_Resume_Publishfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la publication de l'accréditation de cv LER-RS.`)
};

const ko_toasts_resume_publishfailed1 = /** @type {(inputs: Toasts_Resume_Publishfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LER-RS 이력서 자격 증명 게시에 실패했습니다.`)
};

/**
* | output |
* | --- |
* | "Failed to publish LER-RS resume credential." |
*
* @param {Toasts_Resume_Publishfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_resume_publishfailed1 = /** @type {((inputs?: Toasts_Resume_Publishfailed1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Publishfailed1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_publishfailed1(inputs)
	if (locale === "es") return es_toasts_resume_publishfailed1(inputs)
	if (locale === "de") return de_toasts_resume_publishfailed1(inputs)
	if (locale === "ar") return ar_toasts_resume_publishfailed1(inputs)
	if (locale === "fr") return fr_toasts_resume_publishfailed1(inputs)
	return ko_toasts_resume_publishfailed1(inputs)
});
export { toasts_resume_publishfailed1 as "toasts.resume.publishFailed" }