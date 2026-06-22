/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Scanner_Downloadqrcodedescription3Inputs */

const en_scanner_downloadqrcodedescription3 = /** @type {(inputs: Scanner_Downloadqrcodedescription3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Share or print your ${i?.brand} QR code.`)
};

const es_scanner_downloadqrcodedescription3 = /** @type {(inputs: Scanner_Downloadqrcodedescription3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Comparte o imprime tu código QR de ${i?.brand}.`)
};

const fr_scanner_downloadqrcodedescription3 = /** @type {(inputs: Scanner_Downloadqrcodedescription3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Partagez ou imprimez votre code QR ${i?.brand}.`)
};

const ar_scanner_downloadqrcodedescription3 = /** @type {(inputs: Scanner_Downloadqrcodedescription3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`شارك أو اطبع رمز QR الخاص بك على ${i?.brand}.`)
};

/**
* | output |
* | --- |
* | "Share or print your {brand} QR code." |
*
* @param {Scanner_Downloadqrcodedescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_downloadqrcodedescription3 = /** @type {((inputs: Scanner_Downloadqrcodedescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Downloadqrcodedescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_downloadqrcodedescription3(inputs)
	if (locale === "es") return es_scanner_downloadqrcodedescription3(inputs)
	if (locale === "fr") return fr_scanner_downloadqrcodedescription3(inputs)
	return ar_scanner_downloadqrcodedescription3(inputs)
});
export { scanner_downloadqrcodedescription3 as "scanner.downloadQrCodeDescription" }