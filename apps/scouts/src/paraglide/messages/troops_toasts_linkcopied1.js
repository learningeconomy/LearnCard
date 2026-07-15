/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Toasts_Linkcopied1Inputs */

const en_troops_toasts_linkcopied1 = /** @type {(inputs: Troops_Toasts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troop link copied to clipboard`)
};

const es_troops_toasts_linkcopied1 = /** @type {(inputs: Troops_Toasts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace de Troop copiado al portapapeles`)
};

const fr_troops_toasts_linkcopied1 = /** @type {(inputs: Troops_Toasts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien de la troupe copié dans le presse-papiers`)
};

const ar_troops_toasts_linkcopied1 = /** @type {(inputs: Troops_Toasts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troop link copied to clipboard`)
};

/**
* | output |
* | --- |
* | "Troop link copied to clipboard" |
*
* @param {Troops_Toasts_Linkcopied1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_toasts_linkcopied1 = /** @type {((inputs?: Troops_Toasts_Linkcopied1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Toasts_Linkcopied1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_toasts_linkcopied1(inputs)
	if (locale === "es") return es_troops_toasts_linkcopied1(inputs)
	if (locale === "fr") return fr_troops_toasts_linkcopied1(inputs)
	return ar_troops_toasts_linkcopied1(inputs)
});
export { troops_toasts_linkcopied1 as "troops.toasts.linkCopied" }