/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Jsoncopyfailed2Inputs */

const en_toasts_jsoncopyfailed2 = /** @type {(inputs: Toasts_Jsoncopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy JSON to clipboard`)
};

const es_toasts_jsoncopyfailed2 = /** @type {(inputs: Toasts_Jsoncopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar JSON al portapapeles`)
};

const de_toasts_jsoncopyfailed2 = /** @type {(inputs: Toasts_Jsoncopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON konnte nicht in die Zwischenablage kopiert werden`)
};

const ar_toasts_jsoncopyfailed2 = /** @type {(inputs: Toasts_Jsoncopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ JSON إلى الحافظة`)
};

const fr_toasts_jsoncopyfailed2 = /** @type {(inputs: Toasts_Jsoncopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le JSON dans le presse-papiers`)
};

const ko_toasts_jsoncopyfailed2 = /** @type {(inputs: Toasts_Jsoncopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON을 클립보드에 복사할 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to copy JSON to clipboard" |
*
* @param {Toasts_Jsoncopyfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_jsoncopyfailed2 = /** @type {((inputs?: Toasts_Jsoncopyfailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Jsoncopyfailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_jsoncopyfailed2(inputs)
	if (locale === "es") return es_toasts_jsoncopyfailed2(inputs)
	if (locale === "de") return de_toasts_jsoncopyfailed2(inputs)
	if (locale === "ar") return ar_toasts_jsoncopyfailed2(inputs)
	if (locale === "fr") return fr_toasts_jsoncopyfailed2(inputs)
	return ko_toasts_jsoncopyfailed2(inputs)
});
export { toasts_jsoncopyfailed2 as "toasts.jsonCopyFailed" }