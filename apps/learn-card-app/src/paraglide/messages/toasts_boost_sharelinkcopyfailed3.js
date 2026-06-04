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

const de_toasts_boost_sharelinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Sharelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Freigabelink konnte nicht kopiert werden`)
};

const ar_toasts_boost_sharelinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Sharelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ رابط المشاركة`)
};

const fr_toasts_boost_sharelinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Sharelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien de partage`)
};

const ko_toasts_boost_sharelinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Sharelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`공유 링크를 복사할 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to copy share link to clipboard" |
*
* @param {Toasts_Boost_Sharelinkcopyfailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_boost_sharelinkcopyfailed3 = /** @type {((inputs?: Toasts_Boost_Sharelinkcopyfailed3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Sharelinkcopyfailed3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_sharelinkcopyfailed3(inputs)
	if (locale === "es") return es_toasts_boost_sharelinkcopyfailed3(inputs)
	if (locale === "de") return de_toasts_boost_sharelinkcopyfailed3(inputs)
	if (locale === "ar") return ar_toasts_boost_sharelinkcopyfailed3(inputs)
	if (locale === "fr") return fr_toasts_boost_sharelinkcopyfailed3(inputs)
	return ko_toasts_boost_sharelinkcopyfailed3(inputs)
});
export { toasts_boost_sharelinkcopyfailed3 as "toasts.boost.shareLinkCopyFailed" }