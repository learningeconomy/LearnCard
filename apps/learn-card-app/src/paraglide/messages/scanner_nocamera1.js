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

const fr_scanner_nocamera1 = /** @type {(inputs: Scanner_Nocamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune caméra disponible`)
};

const ar_scanner_nocamera1 = /** @type {(inputs: Scanner_Nocamera1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد كاميرا متاحة`)
};

/**
* | output |
* | --- |
* | "No camera available" |
*
* @param {Scanner_Nocamera1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_nocamera1 = /** @type {((inputs?: Scanner_Nocamera1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Nocamera1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_nocamera1(inputs)
	if (locale === "es") return es_scanner_nocamera1(inputs)
	if (locale === "fr") return fr_scanner_nocamera1(inputs)
	return ar_scanner_nocamera1(inputs)
});
export { scanner_nocamera1 as "scanner.noCamera" }