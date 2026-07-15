/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Toasts_Sharefail1Inputs */

const en_troops_toasts_sharefail1 = /** @type {(inputs: Troops_Toasts_Sharefail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to copy link to clipboard`)
};

const es_troops_toasts_sharefail1 = /** @type {(inputs: Troops_Toasts_Sharefail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al copiar enlace al portapapeles`)
};

const fr_troops_toasts_sharefail1 = /** @type {(inputs: Troops_Toasts_Sharefail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la copie du lien dans le presse-papiers`)
};

const ar_troops_toasts_sharefail1 = /** @type {(inputs: Troops_Toasts_Sharefail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل نسخ الرابط إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Failed to copy link to clipboard" |
*
* @param {Troops_Toasts_Sharefail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_toasts_sharefail1 = /** @type {((inputs?: Troops_Toasts_Sharefail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Toasts_Sharefail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_toasts_sharefail1(inputs)
	if (locale === "es") return es_troops_toasts_sharefail1(inputs)
	if (locale === "fr") return fr_troops_toasts_sharefail1(inputs)
	return ar_troops_toasts_sharefail1(inputs)
});
export { troops_toasts_sharefail1 as "troops.toasts.shareFail" }