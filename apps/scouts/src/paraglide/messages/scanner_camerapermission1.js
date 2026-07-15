/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Camerapermission1Inputs */

const en_scanner_camerapermission1 = /** @type {(inputs: Scanner_Camerapermission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Camera permission required`)
};

const es_scanner_camerapermission1 = /** @type {(inputs: Scanner_Camerapermission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se requiere permiso de cámara`)
};

const fr_scanner_camerapermission1 = /** @type {(inputs: Scanner_Camerapermission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorisation de caméra requise`)
};

const ar_scanner_camerapermission1 = /** @type {(inputs: Scanner_Camerapermission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يلزم إذن الكاميرا`)
};

/**
* | output |
* | --- |
* | "Camera permission required" |
*
* @param {Scanner_Camerapermission1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_camerapermission1 = /** @type {((inputs?: Scanner_Camerapermission1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Camerapermission1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_camerapermission1(inputs)
	if (locale === "es") return es_scanner_camerapermission1(inputs)
	if (locale === "fr") return fr_scanner_camerapermission1(inputs)
	return ar_scanner_camerapermission1(inputs)
});
export { scanner_camerapermission1 as "scanner.cameraPermission" }