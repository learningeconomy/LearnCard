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

const fr_toasts_skills_pastevalidlink2 = /** @type {(inputs: Toasts_Skills_Pastevalidlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez coller un lien de cadre OpenSALT valide.`)
};

const ar_toasts_skills_pastevalidlink2 = /** @type {(inputs: Toasts_Skills_Pastevalidlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى لصق رابط إطار OpenSALT صالح.`)
};

/**
* | output |
* | --- |
* | "Please paste a valid OpenSALT framework link." |
*
* @param {Toasts_Skills_Pastevalidlink2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_skills_pastevalidlink2 = /** @type {((inputs?: Toasts_Skills_Pastevalidlink2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Pastevalidlink2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_pastevalidlink2(inputs)
	if (locale === "es") return es_toasts_skills_pastevalidlink2(inputs)
	if (locale === "fr") return fr_toasts_skills_pastevalidlink2(inputs)
	return ar_toasts_skills_pastevalidlink2(inputs)
});
export { toasts_skills_pastevalidlink2 as "toasts.skills.pasteValidLink" }