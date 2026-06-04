/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Nocamera1Inputs */

const en_scanner_nocamera1 = /** @type {(inputs: Scanner_Nocamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No camera available`)
};

const es_scanner_nocamera1 = /** @type {(inputs: Scanner_Nocamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cámara no disponible`)
};

const de_scanner_nocamera1 = /** @type {(inputs: Scanner_Nocamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keine Kamera verfügbar`)
};

const ar_scanner_nocamera1 = /** @type {(inputs: Scanner_Nocamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد كاميرا متاحة`)
};

const fr_scanner_nocamera1 = /** @type {(inputs: Scanner_Nocamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune caméra disponible`)
};

const ko_scanner_nocamera1 = /** @type {(inputs: Scanner_Nocamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`사용 가능한 카메라 없음`)
};

/**
* | output |
* | --- |
* | "No camera available" |
*
* @param {Scanner_Nocamera1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const scanner_nocamera1 = /** @type {((inputs?: Scanner_Nocamera1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Nocamera1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_nocamera1(inputs)
	if (locale === "es") return es_scanner_nocamera1(inputs)
	if (locale === "de") return de_scanner_nocamera1(inputs)
	if (locale === "ar") return ar_scanner_nocamera1(inputs)
	if (locale === "fr") return fr_scanner_nocamera1(inputs)
	return ko_scanner_nocamera1(inputs)
});
export { scanner_nocamera1 as "scanner.noCamera" }