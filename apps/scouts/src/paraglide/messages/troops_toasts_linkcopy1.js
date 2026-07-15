/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Toasts_Linkcopy1Inputs */

const en_troops_toasts_linkcopy1 = /** @type {(inputs: Troops_Toasts_Linkcopy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy Troop link`)
};

const es_troops_toasts_linkcopy1 = /** @type {(inputs: Troops_Toasts_Linkcopy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace de Troop`)
};

const fr_troops_toasts_linkcopy1 = /** @type {(inputs: Troops_Toasts_Linkcopy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien de la troupe`)
};

const ar_troops_toasts_linkcopy1 = /** @type {(inputs: Troops_Toasts_Linkcopy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy Troop link`)
};

/**
* | output |
* | --- |
* | "Unable to copy Troop link" |
*
* @param {Troops_Toasts_Linkcopy1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_toasts_linkcopy1 = /** @type {((inputs?: Troops_Toasts_Linkcopy1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Toasts_Linkcopy1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_toasts_linkcopy1(inputs)
	if (locale === "es") return es_troops_toasts_linkcopy1(inputs)
	if (locale === "fr") return fr_troops_toasts_linkcopy1(inputs)
	return ar_troops_toasts_linkcopy1(inputs)
});
export { troops_toasts_linkcopy1 as "troops.toasts.linkCopy" }