/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ error: NonNullable<unknown> }} Toasts_Goals_Saveerror1Inputs */

const en_toasts_goals_saveerror1 = /** @type {(inputs: Toasts_Goals_Saveerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error saving goals!${i?.error}`)
};

const es_toasts_goals_saveerror1 = /** @type {(inputs: Toasts_Goals_Saveerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¡Error al guardar metas!${i?.error}`)
};

const fr_toasts_goals_saveerror1 = /** @type {(inputs: Toasts_Goals_Saveerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Erreur lors de l'enregistrement des objectifs !${i?.error}`)
};

const ar_toasts_goals_saveerror1 = /** @type {(inputs: Toasts_Goals_Saveerror1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`خطأ في حفظ الأهداف!${i?.error}`)
};

/**
* | output |
* | --- |
* | "Error saving goals!{error}" |
*
* @param {Toasts_Goals_Saveerror1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_goals_saveerror1 = /** @type {((inputs: Toasts_Goals_Saveerror1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Goals_Saveerror1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_goals_saveerror1(inputs)
	if (locale === "es") return es_toasts_goals_saveerror1(inputs)
	if (locale === "fr") return fr_toasts_goals_saveerror1(inputs)
	return ar_toasts_goals_saveerror1(inputs)
});
export { toasts_goals_saveerror1 as "toasts.goals.saveError" }