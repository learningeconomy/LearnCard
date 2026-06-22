/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Savefailed1Inputs */

const en_scanner_savefailed1 = /** @type {(inputs: Scanner_Savefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to save QR Code.`)
};

const es_scanner_savefailed1 = /** @type {(inputs: Scanner_Savefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al guardar el código QR.`)
};

const fr_scanner_savefailed1 = /** @type {(inputs: Scanner_Savefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'enregistrement du code QR.`)
};

const ar_scanner_savefailed1 = /** @type {(inputs: Scanner_Savefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل حفظ رمز QR.`)
};

/**
* | output |
* | --- |
* | "Failed to save QR Code." |
*
* @param {Scanner_Savefailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_savefailed1 = /** @type {((inputs?: Scanner_Savefailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Savefailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_savefailed1(inputs)
	if (locale === "es") return es_scanner_savefailed1(inputs)
	if (locale === "fr") return fr_scanner_savefailed1(inputs)
	return ar_scanner_savefailed1(inputs)
});
export { scanner_savefailed1 as "scanner.saveFailed" }