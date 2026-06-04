/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Copyfailed1Inputs */

const en_toasts_copyfailed1 = /** @type {(inputs: Toasts_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy to clipboard`)
};

const es_toasts_copyfailed1 = /** @type {(inputs: Toasts_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar al portapapeles`)
};

const de_toasts_copyfailed1 = /** @type {(inputs: Toasts_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kopieren in die Zwischenablage fehlgeschlagen`)
};

const ar_toasts_copyfailed1 = /** @type {(inputs: Toasts_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر النسخ إلى الحافظة`)
};

const fr_toasts_copyfailed1 = /** @type {(inputs: Toasts_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier dans le presse-papiers`)
};

const ko_toasts_copyfailed1 = /** @type {(inputs: Toasts_Copyfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`클립보드에 복사할 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to copy to clipboard" |
*
* @param {Toasts_Copyfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_copyfailed1 = /** @type {((inputs?: Toasts_Copyfailed1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Copyfailed1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_copyfailed1(inputs)
	if (locale === "es") return es_toasts_copyfailed1(inputs)
	if (locale === "de") return de_toasts_copyfailed1(inputs)
	if (locale === "ar") return ar_toasts_copyfailed1(inputs)
	if (locale === "fr") return fr_toasts_copyfailed1(inputs)
	return ko_toasts_copyfailed1(inputs)
});
export { toasts_copyfailed1 as "toasts.copyFailed" }