/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Copyfailed1Inputs */

const en_toasts_copyfailed1 = /** @type {(inputs: Toasts_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy to clipboard`)
};

const es_toasts_copyfailed1 = /** @type {(inputs: Toasts_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar al portapapeles`)
};

const fr_toasts_copyfailed1 = /** @type {(inputs: Toasts_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier dans le presse-papiers`)
};

const ar_toasts_copyfailed1 = /** @type {(inputs: Toasts_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر النسخ إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Unable to copy to clipboard" |
*
* @param {Toasts_Copyfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_copyfailed1 = /** @type {((inputs?: Toasts_Copyfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Copyfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_copyfailed1(inputs)
	if (locale === "es") return es_toasts_copyfailed1(inputs)
	if (locale === "fr") return fr_toasts_copyfailed1(inputs)
	return ar_toasts_copyfailed1(inputs)
});
export { toasts_copyfailed1 as "toasts.copyFailed" }