/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Downloadqrcode2Inputs */

const en_scanner_downloadqrcode2 = /** @type {(inputs: Scanner_Downloadqrcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download QR Code`)
};

const es_scanner_downloadqrcode2 = /** @type {(inputs: Scanner_Downloadqrcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descargar código QR`)
};

const fr_scanner_downloadqrcode2 = /** @type {(inputs: Scanner_Downloadqrcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger le code QR`)
};

const ar_scanner_downloadqrcode2 = /** @type {(inputs: Scanner_Downloadqrcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنزيل رمز QR`)
};

/**
* | output |
* | --- |
* | "Download QR Code" |
*
* @param {Scanner_Downloadqrcode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_downloadqrcode2 = /** @type {((inputs?: Scanner_Downloadqrcode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Downloadqrcode2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_downloadqrcode2(inputs)
	if (locale === "es") return es_scanner_downloadqrcode2(inputs)
	if (locale === "fr") return fr_scanner_downloadqrcode2(inputs)
	return ar_scanner_downloadqrcode2(inputs)
});
export { scanner_downloadqrcode2 as "scanner.downloadQrCode" }