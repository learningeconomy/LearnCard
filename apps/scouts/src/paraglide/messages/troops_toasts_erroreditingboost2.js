/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Toasts_Erroreditingboost2Inputs */

const en_troops_toasts_erroreditingboost2 = /** @type {(inputs: Troops_Toasts_Erroreditingboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error editing boost`)
};

const es_troops_toasts_erroreditingboost2 = /** @type {(inputs: Troops_Toasts_Erroreditingboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al editar boost`)
};

const fr_troops_toasts_erroreditingboost2 = /** @type {(inputs: Troops_Toasts_Erroreditingboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur lors de la modification du Boost`)
};

const ar_troops_toasts_erroreditingboost2 = /** @type {(inputs: Troops_Toasts_Erroreditingboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error editing boost`)
};

/**
* | output |
* | --- |
* | "Error editing boost" |
*
* @param {Troops_Toasts_Erroreditingboost2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_toasts_erroreditingboost2 = /** @type {((inputs?: Troops_Toasts_Erroreditingboost2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Toasts_Erroreditingboost2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_toasts_erroreditingboost2(inputs)
	if (locale === "es") return es_troops_toasts_erroreditingboost2(inputs)
	if (locale === "fr") return fr_troops_toasts_erroreditingboost2(inputs)
	return ar_troops_toasts_erroreditingboost2(inputs)
});
export { troops_toasts_erroreditingboost2 as "troops.toasts.errorEditingBoost" }