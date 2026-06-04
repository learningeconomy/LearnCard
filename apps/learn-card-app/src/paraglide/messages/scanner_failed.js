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

const de_scanner_failed = /** @type {(inputs: Scanner_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigung konnte nicht importiert werden`)
};

const ar_scanner_failed = /** @type {(inputs: Scanner_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل استيراد الشهادة`)
};

const fr_scanner_failed = /** @type {(inputs: Scanner_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'importation du titre`)
};

const ko_scanner_failed = /** @type {(inputs: Scanner_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격증명 가져오기 실패`)
};

/**
* | output |
* | --- |
* | "Failed to import credential" |
*
* @param {Scanner_FailedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const scanner_failed = /** @type {((inputs?: Scanner_FailedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_FailedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_failed(inputs)
	if (locale === "es") return es_scanner_failed(inputs)
	if (locale === "de") return de_scanner_failed(inputs)
	if (locale === "ar") return ar_scanner_failed(inputs)
	if (locale === "fr") return fr_scanner_failed(inputs)
	return ko_scanner_failed(inputs)
});
export { scanner_failed as "scanner.failed" }