/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Linkcopyfailed2Inputs */

const en_toasts_linkcopyfailed2 = /** @type {(inputs: Toasts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy link to clipboard`)
};

const es_toasts_linkcopyfailed2 = /** @type {(inputs: Toasts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace al portapapeles`)
};

const fr_toasts_linkcopyfailed2 = /** @type {(inputs: Toasts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien dans le presse-papiers`)
};

const ar_toasts_linkcopyfailed2 = /** @type {(inputs: Toasts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ الرابط إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Unable to copy link to clipboard" |
*
* @param {Toasts_Linkcopyfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_linkcopyfailed2 = /** @type {((inputs?: Toasts_Linkcopyfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Linkcopyfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_linkcopyfailed2(inputs)
	if (locale === "es") return es_toasts_linkcopyfailed2(inputs)
	if (locale === "fr") return fr_toasts_linkcopyfailed2(inputs)
	return ar_toasts_linkcopyfailed2(inputs)
});
export { toasts_linkcopyfailed2 as "toasts.linkCopyFailed" }