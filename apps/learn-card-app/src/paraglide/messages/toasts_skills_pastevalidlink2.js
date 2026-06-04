/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Skills_Pastevalidlink2Inputs */

const en_toasts_skills_pastevalidlink2 = /** @type {(inputs: Toasts_Skills_Pastevalidlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please paste a valid OpenSALT framework link.`)
};

const es_toasts_skills_pastevalidlink2 = /** @type {(inputs: Toasts_Skills_Pastevalidlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor, pega un enlace válido de marco OpenSALT.`)
};

const de_toasts_skills_pastevalidlink2 = /** @type {(inputs: Toasts_Skills_Pastevalidlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bitte fügen Sie einen gültigen OpenSALT-Rahmen-Link ein.`)
};

const ar_toasts_skills_pastevalidlink2 = /** @type {(inputs: Toasts_Skills_Pastevalidlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى لصق رابط إطار OpenSALT صالح.`)
};

const fr_toasts_skills_pastevalidlink2 = /** @type {(inputs: Toasts_Skills_Pastevalidlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez coller un lien de cadre OpenSALT valide.`)
};

const ko_toasts_skills_pastevalidlink2 = /** @type {(inputs: Toasts_Skills_Pastevalidlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`유효한 OpenSALT 프레임워크 링크를 붙여넣으세요.`)
};

/**
* | output |
* | --- |
* | "Please paste a valid OpenSALT framework link." |
*
* @param {Toasts_Skills_Pastevalidlink2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_skills_pastevalidlink2 = /** @type {((inputs?: Toasts_Skills_Pastevalidlink2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Pastevalidlink2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_pastevalidlink2(inputs)
	if (locale === "es") return es_toasts_skills_pastevalidlink2(inputs)
	if (locale === "de") return de_toasts_skills_pastevalidlink2(inputs)
	if (locale === "ar") return ar_toasts_skills_pastevalidlink2(inputs)
	if (locale === "fr") return fr_toasts_skills_pastevalidlink2(inputs)
	return ko_toasts_skills_pastevalidlink2(inputs)
});
export { toasts_skills_pastevalidlink2 as "toasts.skills.pasteValidLink" }