/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Publishedsuccess1Inputs */

const en_toasts_resume_publishedsuccess1 = /** @type {(inputs: Toasts_Resume_Publishedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LER-RS resume credential published successfully.`)
};

const es_toasts_resume_publishedsuccess1 = /** @type {(inputs: Toasts_Resume_Publishedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credencial de currículum LER-RS publicada exitosamente.`)
};

const de_toasts_resume_publishedsuccess1 = /** @type {(inputs: Toasts_Resume_Publishedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LER-RS-Lebenslauf-Berechtigung erfolgreich veröffentlicht.`)
};

const ar_toasts_resume_publishedsuccess1 = /** @type {(inputs: Toasts_Resume_Publishedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نشر بيانات اعتماد السيرة الذاتية LER-RS بنجاح.`)
};

const fr_toasts_resume_publishedsuccess1 = /** @type {(inputs: Toasts_Resume_Publishedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accréditation de cv LER-RS publiée avec succès.`)
};

const ko_toasts_resume_publishedsuccess1 = /** @type {(inputs: Toasts_Resume_Publishedsuccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LER-RS 이력서 자격 증명이 성공적으로 게시되었습니다.`)
};

/**
* | output |
* | --- |
* | "LER-RS resume credential published successfully." |
*
* @param {Toasts_Resume_Publishedsuccess1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_resume_publishedsuccess1 = /** @type {((inputs?: Toasts_Resume_Publishedsuccess1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Publishedsuccess1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_publishedsuccess1(inputs)
	if (locale === "es") return es_toasts_resume_publishedsuccess1(inputs)
	if (locale === "de") return de_toasts_resume_publishedsuccess1(inputs)
	if (locale === "ar") return ar_toasts_resume_publishedsuccess1(inputs)
	if (locale === "fr") return fr_toasts_resume_publishedsuccess1(inputs)
	return ko_toasts_resume_publishedsuccess1(inputs)
});
export { toasts_resume_publishedsuccess1 as "toasts.resume.publishedSuccess" }