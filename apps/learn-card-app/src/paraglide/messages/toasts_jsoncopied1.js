/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Jsoncopied1Inputs */

const en_toasts_jsoncopied1 = /** @type {(inputs: Toasts_Jsoncopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON copied to clipboard`)
};

const es_toasts_jsoncopied1 = /** @type {(inputs: Toasts_Jsoncopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON copiado al portapapeles`)
};

const de_toasts_jsoncopied1 = /** @type {(inputs: Toasts_Jsoncopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON in die Zwischenablage kopiert`)
};

const ar_toasts_jsoncopied1 = /** @type {(inputs: Toasts_Jsoncopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ JSON إلى الحافظة`)
};

const fr_toasts_jsoncopied1 = /** @type {(inputs: Toasts_Jsoncopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON copié dans le presse-papiers`)
};

const ko_toasts_jsoncopied1 = /** @type {(inputs: Toasts_Jsoncopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON이 클립보드에 복사됨`)
};

/**
* | output |
* | --- |
* | "JSON copied to clipboard" |
*
* @param {Toasts_Jsoncopied1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_jsoncopied1 = /** @type {((inputs?: Toasts_Jsoncopied1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Jsoncopied1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_jsoncopied1(inputs)
	if (locale === "es") return es_toasts_jsoncopied1(inputs)
	if (locale === "de") return de_toasts_jsoncopied1(inputs)
	if (locale === "ar") return ar_toasts_jsoncopied1(inputs)
	if (locale === "fr") return fr_toasts_jsoncopied1(inputs)
	return ko_toasts_jsoncopied1(inputs)
});
export { toasts_jsoncopied1 as "toasts.jsonCopied" }