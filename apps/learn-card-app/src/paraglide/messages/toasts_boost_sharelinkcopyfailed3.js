/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Sharelinkcopyfailed3Inputs */

const en_toasts_boost_sharelinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Sharelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy share link to clipboard`)
};

const es_toasts_boost_sharelinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Sharelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace para compartir`)
};

const fr_toasts_boost_sharelinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Sharelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien de partage`)
};

const ar_toasts_boost_sharelinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Sharelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ رابط المشاركة`)
};

/**
* | output |
* | --- |
* | "Unable to copy share link to clipboard" |
*
* @param {Toasts_Boost_Sharelinkcopyfailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_boost_sharelinkcopyfailed3 = /** @type {((inputs?: Toasts_Boost_Sharelinkcopyfailed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Sharelinkcopyfailed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_sharelinkcopyfailed3(inputs)
	if (locale === "es") return es_toasts_boost_sharelinkcopyfailed3(inputs)
	if (locale === "fr") return fr_toasts_boost_sharelinkcopyfailed3(inputs)
	return ar_toasts_boost_sharelinkcopyfailed3(inputs)
});
export { toasts_boost_sharelinkcopyfailed3 as "toasts.boost.shareLinkCopyFailed" }