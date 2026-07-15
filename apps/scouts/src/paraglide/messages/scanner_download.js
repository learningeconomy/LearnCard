/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_DownloadInputs */

const en_scanner_download = /** @type {(inputs: Scanner_DownloadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download`)
};

const es_scanner_download = /** @type {(inputs: Scanner_DownloadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descargar`)
};

const fr_scanner_download = /** @type {(inputs: Scanner_DownloadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger`)
};

const ar_scanner_download = /** @type {(inputs: Scanner_DownloadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنزيل`)
};

/**
* | output |
* | --- |
* | "Download" |
*
* @param {Scanner_DownloadInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_download = /** @type {((inputs?: Scanner_DownloadInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_DownloadInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_download(inputs)
	if (locale === "es") return es_scanner_download(inputs)
	if (locale === "fr") return fr_scanner_download(inputs)
	return ar_scanner_download(inputs)
});
export { scanner_download as "scanner.download" }