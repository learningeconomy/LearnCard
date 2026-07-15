/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Toasts_Sharecopied1Inputs */

const en_troops_toasts_sharecopied1 = /** @type {(inputs: Troops_Toasts_Sharecopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link copied to clipboard!`)
};

const es_troops_toasts_sharecopied1 = /** @type {(inputs: Troops_Toasts_Sharecopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Enlace copiado al portapapeles!`)
};

const fr_troops_toasts_sharecopied1 = /** @type {(inputs: Troops_Toasts_Sharecopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien copié dans le presse-papiers !`)
};

const ar_troops_toasts_sharecopied1 = /** @type {(inputs: Troops_Toasts_Sharecopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link copied to clipboard!`)
};

/**
* | output |
* | --- |
* | "Link copied to clipboard!" |
*
* @param {Troops_Toasts_Sharecopied1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_toasts_sharecopied1 = /** @type {((inputs?: Troops_Toasts_Sharecopied1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Toasts_Sharecopied1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_toasts_sharecopied1(inputs)
	if (locale === "es") return es_troops_toasts_sharecopied1(inputs)
	if (locale === "fr") return fr_troops_toasts_sharecopied1(inputs)
	return ar_troops_toasts_sharecopied1(inputs)
});
export { troops_toasts_sharecopied1 as "troops.toasts.shareCopied" }