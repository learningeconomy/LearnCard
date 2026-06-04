/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ error: NonNullable<unknown> }} Toasts_Skills_Saveerror1Inputs */

const en_toasts_skills_saveerror1 = /** @type {(inputs: Toasts_Skills_Saveerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error saving skills!${i?.error}`)
};

const es_toasts_skills_saveerror1 = /** @type {(inputs: Toasts_Skills_Saveerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¡Error al guardar habilidades!${i?.error}`)
};

const de_toasts_skills_saveerror1 = /** @type {(inputs: Toasts_Skills_Saveerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Fehler beim Speichern der Fähigkeiten!${i?.error}`)
};

const ar_toasts_skills_saveerror1 = /** @type {(inputs: Toasts_Skills_Saveerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`خطأ في حفظ المهارات!${i?.error}`)
};

const fr_toasts_skills_saveerror1 = /** @type {(inputs: Toasts_Skills_Saveerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Erreur lors de l'enregistrement des compétences !${i?.error}`)
};

const ko_toasts_skills_saveerror1 = /** @type {(inputs: Toasts_Skills_Saveerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`기술 저장 오류!${i?.error}`)
};

/**
* | output |
* | --- |
* | "Error saving skills!{error}" |
*
* @param {Toasts_Skills_Saveerror1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_skills_saveerror1 = /** @type {((inputs: Toasts_Skills_Saveerror1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Saveerror1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_saveerror1(inputs)
	if (locale === "es") return es_toasts_skills_saveerror1(inputs)
	if (locale === "de") return de_toasts_skills_saveerror1(inputs)
	if (locale === "ar") return ar_toasts_skills_saveerror1(inputs)
	if (locale === "fr") return fr_toasts_skills_saveerror1(inputs)
	return ko_toasts_skills_saveerror1(inputs)
});
export { toasts_skills_saveerror1 as "toasts.skills.saveError" }