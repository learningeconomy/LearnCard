/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_CopiedInputs */

const en_toasts_copied = /** @type {(inputs: Toasts_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copied to clipboard`)
};

const es_toasts_copied = /** @type {(inputs: Toasts_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiado al portapapeles`)
};

const fr_toasts_copied = /** @type {(inputs: Toasts_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copié dans le presse-papiers`)
};

const ar_toasts_copied = /** @type {(inputs: Toasts_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم النسخ إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Copied to clipboard" |
*
* @param {Toasts_CopiedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_copied = /** @type {((inputs?: Toasts_CopiedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_CopiedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_copied(inputs)
	if (locale === "es") return es_toasts_copied(inputs)
	if (locale === "fr") return fr_toasts_copied(inputs)
	return ar_toasts_copied(inputs)
});
export { toasts_copied as "toasts.copied" }