/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Toasts_Unabletocopylink3Inputs */

const en_boost_toasts_unabletocopylink3 = /** @type {(inputs: Boost_Toasts_Unabletocopylink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy share link to clipboard`)
};

const es_boost_toasts_unabletocopylink3 = /** @type {(inputs: Boost_Toasts_Unabletocopylink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace al portapapeles`)
};

const fr_boost_toasts_unabletocopylink3 = /** @type {(inputs: Boost_Toasts_Unabletocopylink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien de partage dans le presse-papiers`)
};

const ar_boost_toasts_unabletocopylink3 = /** @type {(inputs: Boost_Toasts_Unabletocopylink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ رابط المشاركة إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Unable to copy share link to clipboard" |
*
* @param {Boost_Toasts_Unabletocopylink3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_toasts_unabletocopylink3 = /** @type {((inputs?: Boost_Toasts_Unabletocopylink3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Toasts_Unabletocopylink3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_toasts_unabletocopylink3(inputs)
	if (locale === "es") return es_boost_toasts_unabletocopylink3(inputs)
	if (locale === "fr") return fr_boost_toasts_unabletocopylink3(inputs)
	return ar_boost_toasts_unabletocopylink3(inputs)
});
export { boost_toasts_unabletocopylink3 as "boost.toasts.unableToCopyLink" }