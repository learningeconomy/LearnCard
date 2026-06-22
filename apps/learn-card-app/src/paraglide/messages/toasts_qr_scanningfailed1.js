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

const fr_toasts_qr_scanningfailed1 = /** @type {(inputs: Toasts_Qr_Scanningfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de scanner le code QR`)
};

const ar_toasts_qr_scanningfailed1 = /** @type {(inputs: Toasts_Qr_Scanningfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر مسح رمز QR`)
};

/**
* | output |
* | --- |
* | "Unable to scan QR code" |
*
* @param {Toasts_Qr_Scanningfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_qr_scanningfailed1 = /** @type {((inputs?: Toasts_Qr_Scanningfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Qr_Scanningfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_qr_scanningfailed1(inputs)
	if (locale === "es") return es_toasts_qr_scanningfailed1(inputs)
	if (locale === "fr") return fr_toasts_qr_scanningfailed1(inputs)
	return ar_toasts_qr_scanningfailed1(inputs)
});
export { toasts_qr_scanningfailed1 as "toasts.qr.scanningFailed" }