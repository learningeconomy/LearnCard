/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Savedtophotos2Inputs */

const en_scanner_savedtophotos2 = /** @type {(inputs: Scanner_Savedtophotos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`QR Code saved to Photos!`)
};

const es_scanner_savedtophotos2 = /** @type {(inputs: Scanner_Savedtophotos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Código QR guardado en Fotos!`)
};

const fr_scanner_savedtophotos2 = /** @type {(inputs: Scanner_Savedtophotos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code QR enregistré dans Photos !`)
};

const ar_scanner_savedtophotos2 = /** @type {(inputs: Scanner_Savedtophotos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ رمز QR في الصور!`)
};

/**
* | output |
* | --- |
* | "QR Code saved to Photos!" |
*
* @param {Scanner_Savedtophotos2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_savedtophotos2 = /** @type {((inputs?: Scanner_Savedtophotos2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Savedtophotos2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_savedtophotos2(inputs)
	if (locale === "es") return es_scanner_savedtophotos2(inputs)
	if (locale === "fr") return fr_scanner_savedtophotos2(inputs)
	return ar_scanner_savedtophotos2(inputs)
});
export { scanner_savedtophotos2 as "scanner.savedToPhotos" }