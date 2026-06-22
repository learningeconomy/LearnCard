/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Jsoncopyfailed2Inputs */

const en_toasts_jsoncopyfailed2 = /** @type {(inputs: Toasts_Jsoncopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy JSON to clipboard`)
};

const es_toasts_jsoncopyfailed2 = /** @type {(inputs: Toasts_Jsoncopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar JSON al portapapeles`)
};

const fr_toasts_jsoncopyfailed2 = /** @type {(inputs: Toasts_Jsoncopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le JSON dans le presse-papiers`)
};

const ar_toasts_jsoncopyfailed2 = /** @type {(inputs: Toasts_Jsoncopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ JSON إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Unable to copy JSON to clipboard" |
*
* @param {Toasts_Jsoncopyfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_jsoncopyfailed2 = /** @type {((inputs?: Toasts_Jsoncopyfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Jsoncopyfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_jsoncopyfailed2(inputs)
	if (locale === "es") return es_toasts_jsoncopyfailed2(inputs)
	if (locale === "fr") return fr_toasts_jsoncopyfailed2(inputs)
	return ar_toasts_jsoncopyfailed2(inputs)
});
export { toasts_jsoncopyfailed2 as "toasts.jsonCopyFailed" }