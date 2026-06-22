/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ error: NonNullable<unknown> }} Toasts_Skills_Updateerror1Inputs */

const en_toasts_skills_updateerror1 = /** @type {(inputs: Toasts_Skills_Updateerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error updating skills: ${i?.error}`)
};

const es_toasts_skills_updateerror1 = /** @type {(inputs: Toasts_Skills_Updateerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error al actualizar habilidades: ${i?.error}`)
};

const fr_toasts_skills_updateerror1 = /** @type {(inputs: Toasts_Skills_Updateerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Erreur lors de la mise à jour des compétences : ${i?.error}`)
};

const ar_toasts_skills_updateerror1 = /** @type {(inputs: Toasts_Skills_Updateerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`خطأ في تحديث المهارات: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "Error updating skills: {error}" |
*
* @param {Toasts_Skills_Updateerror1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_skills_updateerror1 = /** @type {((inputs: Toasts_Skills_Updateerror1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Skills_Updateerror1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_skills_updateerror1(inputs)
	if (locale === "es") return es_toasts_skills_updateerror1(inputs)
	if (locale === "fr") return fr_toasts_skills_updateerror1(inputs)
	return ar_toasts_skills_updateerror1(inputs)
});
export { toasts_skills_updateerror1 as "toasts.skills.updateError" }