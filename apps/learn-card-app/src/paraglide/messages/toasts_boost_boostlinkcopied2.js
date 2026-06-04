/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Boostlinkcopied2Inputs */

const en_toasts_boost_boostlinkcopied2 = /** @type {(inputs: Toasts_Boost_Boostlinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost link copied to clipboard`)
};

const es_toasts_boost_boostlinkcopied2 = /** @type {(inputs: Toasts_Boost_Boostlinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace del boost copiado al portapapeles`)
};

const de_toasts_boost_boostlinkcopied2 = /** @type {(inputs: Toasts_Boost_Boostlinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost-Link in die Zwischenablage kopiert`)
};

const ar_toasts_boost_boostlinkcopied2 = /** @type {(inputs: Toasts_Boost_Boostlinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط Boost إلى الحافظة`)
};

const fr_toasts_boost_boostlinkcopied2 = /** @type {(inputs: Toasts_Boost_Boostlinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien du boost copié dans le presse-papiers`)
};

const ko_toasts_boost_boostlinkcopied2 = /** @type {(inputs: Toasts_Boost_Boostlinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부스트 링크가 클립보드에 복사됨`)
};

/**
* | output |
* | --- |
* | "Boost link copied to clipboard" |
*
* @param {Toasts_Boost_Boostlinkcopied2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_boost_boostlinkcopied2 = /** @type {((inputs?: Toasts_Boost_Boostlinkcopied2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Boostlinkcopied2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_boostlinkcopied2(inputs)
	if (locale === "es") return es_toasts_boost_boostlinkcopied2(inputs)
	if (locale === "de") return de_toasts_boost_boostlinkcopied2(inputs)
	if (locale === "ar") return ar_toasts_boost_boostlinkcopied2(inputs)
	if (locale === "fr") return fr_toasts_boost_boostlinkcopied2(inputs)
	return ko_toasts_boost_boostlinkcopied2(inputs)
});
export { toasts_boost_boostlinkcopied2 as "toasts.boost.boostLinkCopied" }