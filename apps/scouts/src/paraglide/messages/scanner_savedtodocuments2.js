/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Savedtodocuments2Inputs */

const en_scanner_savedtodocuments2 = /** @type {(inputs: Scanner_Savedtodocuments2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`QR Code saved to Documents!`)
};

const es_scanner_savedtodocuments2 = /** @type {(inputs: Scanner_Savedtodocuments2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Código QR guardado en Documentos!`)
};

const fr_scanner_savedtodocuments2 = /** @type {(inputs: Scanner_Savedtodocuments2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code QR enregistré dans Documents !`)
};

const ar_scanner_savedtodocuments2 = /** @type {(inputs: Scanner_Savedtodocuments2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ رمز QR في المستندات!`)
};

/**
* | output |
* | --- |
* | "QR Code saved to Documents!" |
*
* @param {Scanner_Savedtodocuments2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_savedtodocuments2 = /** @type {((inputs?: Scanner_Savedtodocuments2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Savedtodocuments2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_savedtodocuments2(inputs)
	if (locale === "es") return es_scanner_savedtodocuments2(inputs)
	if (locale === "fr") return fr_scanner_savedtodocuments2(inputs)
	return ar_scanner_savedtodocuments2(inputs)
});
export { scanner_savedtodocuments2 as "scanner.savedToDocuments" }