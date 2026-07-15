/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Savepdffailed2Inputs */

const en_scanner_savepdffailed2 = /** @type {(inputs: Scanner_Savepdffailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to save QR Code PDF.`)
};

const es_scanner_savepdffailed2 = /** @type {(inputs: Scanner_Savepdffailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al guardar el código QR en PDF.`)
};

const fr_scanner_savepdffailed2 = /** @type {(inputs: Scanner_Savepdffailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'enregistrement du code QR en PDF.`)
};

const ar_scanner_savepdffailed2 = /** @type {(inputs: Scanner_Savepdffailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل حفظ رمز QR كـ PDF.`)
};

/**
* | output |
* | --- |
* | "Failed to save QR Code PDF." |
*
* @param {Scanner_Savepdffailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_savepdffailed2 = /** @type {((inputs?: Scanner_Savepdffailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Savepdffailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_savepdffailed2(inputs)
	if (locale === "es") return es_scanner_savepdffailed2(inputs)
	if (locale === "fr") return fr_scanner_savepdffailed2(inputs)
	return ar_scanner_savepdffailed2(inputs)
});
export { scanner_savepdffailed2 as "scanner.savePdfFailed" }