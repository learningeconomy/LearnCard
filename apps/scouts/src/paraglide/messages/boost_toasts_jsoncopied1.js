/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Toasts_Jsoncopied1Inputs */

const en_boost_toasts_jsoncopied1 = /** @type {(inputs: Boost_Toasts_Jsoncopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON copied to clipboard`)
};

const es_boost_toasts_jsoncopied1 = /** @type {(inputs: Boost_Toasts_Jsoncopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON copiado al portapapeles`)
};

const fr_boost_toasts_jsoncopied1 = /** @type {(inputs: Boost_Toasts_Jsoncopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON copié dans le presse-papiers`)
};

const ar_boost_toasts_jsoncopied1 = /** @type {(inputs: Boost_Toasts_Jsoncopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON copied to clipboard`)
};

/**
* | output |
* | --- |
* | "JSON copied to clipboard" |
*
* @param {Boost_Toasts_Jsoncopied1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_toasts_jsoncopied1 = /** @type {((inputs?: Boost_Toasts_Jsoncopied1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Toasts_Jsoncopied1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_toasts_jsoncopied1(inputs)
	if (locale === "es") return es_boost_toasts_jsoncopied1(inputs)
	if (locale === "fr") return fr_boost_toasts_jsoncopied1(inputs)
	return ar_boost_toasts_jsoncopied1(inputs)
});
export { boost_toasts_jsoncopied1 as "boost.toasts.jsonCopied" }