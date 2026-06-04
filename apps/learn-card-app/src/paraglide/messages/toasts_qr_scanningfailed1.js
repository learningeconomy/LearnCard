/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Qr_Scanningfailed1Inputs */

const en_toasts_qr_scanningfailed1 = /** @type {(inputs: Toasts_Qr_Scanningfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to scan QR code`)
};

const es_toasts_qr_scanningfailed1 = /** @type {(inputs: Toasts_Qr_Scanningfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo escanear el código QR`)
};

const de_toasts_qr_scanningfailed1 = /** @type {(inputs: Toasts_Qr_Scanningfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`QR-Code konnte nicht gescannt werden`)
};

const ar_toasts_qr_scanningfailed1 = /** @type {(inputs: Toasts_Qr_Scanningfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر مسح رمز QR`)
};

const fr_toasts_qr_scanningfailed1 = /** @type {(inputs: Toasts_Qr_Scanningfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de scanner le code QR`)
};

const ko_toasts_qr_scanningfailed1 = /** @type {(inputs: Toasts_Qr_Scanningfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`QR 코드를 스캔할 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to scan QR code" |
*
* @param {Toasts_Qr_Scanningfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_qr_scanningfailed1 = /** @type {((inputs?: Toasts_Qr_Scanningfailed1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Qr_Scanningfailed1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_qr_scanningfailed1(inputs)
	if (locale === "es") return es_toasts_qr_scanningfailed1(inputs)
	if (locale === "de") return de_toasts_qr_scanningfailed1(inputs)
	if (locale === "ar") return ar_toasts_qr_scanningfailed1(inputs)
	if (locale === "fr") return fr_toasts_qr_scanningfailed1(inputs)
	return ko_toasts_qr_scanningfailed1(inputs)
});
export { toasts_qr_scanningfailed1 as "toasts.qr.scanningFailed" }