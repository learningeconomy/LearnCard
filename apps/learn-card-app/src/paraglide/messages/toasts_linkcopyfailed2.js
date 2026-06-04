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

const de_toasts_linkcopyfailed2 = /** @type {(inputs: Toasts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link konnte nicht in die Zwischenablage kopiert werden`)
};

const ar_toasts_linkcopyfailed2 = /** @type {(inputs: Toasts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ الرابط إلى الحافظة`)
};

const fr_toasts_linkcopyfailed2 = /** @type {(inputs: Toasts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien dans le presse-papiers`)
};

const ko_toasts_linkcopyfailed2 = /** @type {(inputs: Toasts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`링크를 클립보드에 복사할 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to copy link to clipboard" |
*
* @param {Toasts_Linkcopyfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_linkcopyfailed2 = /** @type {((inputs?: Toasts_Linkcopyfailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Linkcopyfailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_linkcopyfailed2(inputs)
	if (locale === "es") return es_toasts_linkcopyfailed2(inputs)
	if (locale === "de") return de_toasts_linkcopyfailed2(inputs)
	if (locale === "ar") return ar_toasts_linkcopyfailed2(inputs)
	if (locale === "fr") return fr_toasts_linkcopyfailed2(inputs)
	return ko_toasts_linkcopyfailed2(inputs)
});
export { toasts_linkcopyfailed2 as "toasts.linkCopyFailed" }