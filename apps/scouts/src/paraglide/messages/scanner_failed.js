/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_FailedInputs */

const en_scanner_failed = /** @type {(inputs: Scanner_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to import credential`)
};

const es_scanner_failed = /** @type {(inputs: Scanner_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al importar la credencial`)
};

const fr_scanner_failed = /** @type {(inputs: Scanner_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'importation du titre`)
};

const ar_scanner_failed = /** @type {(inputs: Scanner_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل استيراد الشهادة`)
};

/**
* | output |
* | --- |
* | "Failed to import credential" |
*
* @param {Scanner_FailedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_failed = /** @type {((inputs?: Scanner_FailedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_FailedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_failed(inputs)
	if (locale === "es") return es_scanner_failed(inputs)
	if (locale === "fr") return fr_scanner_failed(inputs)
	return ar_scanner_failed(inputs)
});
export { scanner_failed as "scanner.failed" }