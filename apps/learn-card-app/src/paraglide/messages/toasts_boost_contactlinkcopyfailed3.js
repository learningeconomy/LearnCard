/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Contactlinkcopyfailed3Inputs */

const en_toasts_boost_contactlinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Contactlinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy Contact link to clipboard`)
};

const es_toasts_boost_contactlinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Contactlinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace de contacto`)
};

const de_toasts_boost_contactlinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Contactlinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontaktlink konnte nicht kopiert werden`)
};

const ar_toasts_boost_contactlinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Contactlinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ رابط جهة الاتصال`)
};

const fr_toasts_boost_contactlinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Contactlinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien de contact`)
};

const ko_toasts_boost_contactlinkcopyfailed3 = /** @type {(inputs: Toasts_Boost_Contactlinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연락처 링크를 복사할 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to copy Contact link to clipboard" |
*
* @param {Toasts_Boost_Contactlinkcopyfailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_boost_contactlinkcopyfailed3 = /** @type {((inputs?: Toasts_Boost_Contactlinkcopyfailed3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Contactlinkcopyfailed3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_contactlinkcopyfailed3(inputs)
	if (locale === "es") return es_toasts_boost_contactlinkcopyfailed3(inputs)
	if (locale === "de") return de_toasts_boost_contactlinkcopyfailed3(inputs)
	if (locale === "ar") return ar_toasts_boost_contactlinkcopyfailed3(inputs)
	if (locale === "fr") return fr_toasts_boost_contactlinkcopyfailed3(inputs)
	return ko_toasts_boost_contactlinkcopyfailed3(inputs)
});
export { toasts_boost_contactlinkcopyfailed3 as "toasts.boost.contactLinkCopyFailed" }