/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Toasts_Sharelinkcopied2Inputs */

const en_boost_toasts_sharelinkcopied2 = /** @type {(inputs: Boost_Toasts_Sharelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share link copied to clipboard`)
};

const es_boost_toasts_sharelinkcopied2 = /** @type {(inputs: Boost_Toasts_Sharelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace compartido copiado al portapapeles`)
};

const fr_boost_toasts_sharelinkcopied2 = /** @type {(inputs: Boost_Toasts_Sharelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien de partage copié dans le presse-papiers`)
};

const ar_boost_toasts_sharelinkcopied2 = /** @type {(inputs: Boost_Toasts_Sharelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط المشاركة إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Share link copied to clipboard" |
*
* @param {Boost_Toasts_Sharelinkcopied2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_toasts_sharelinkcopied2 = /** @type {((inputs?: Boost_Toasts_Sharelinkcopied2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Toasts_Sharelinkcopied2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_toasts_sharelinkcopied2(inputs)
	if (locale === "es") return es_boost_toasts_sharelinkcopied2(inputs)
	if (locale === "fr") return fr_boost_toasts_sharelinkcopied2(inputs)
	return ar_boost_toasts_sharelinkcopied2(inputs)
});
export { boost_toasts_sharelinkcopied2 as "boost.toasts.shareLinkCopied" }