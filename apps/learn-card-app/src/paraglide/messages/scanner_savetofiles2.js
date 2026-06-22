/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Savetofiles2Inputs */

const en_scanner_savetofiles2 = /** @type {(inputs: Scanner_Savetofiles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save to Files`)
};

const es_scanner_savetofiles2 = /** @type {(inputs: Scanner_Savetofiles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar en Archivos`)
};

const fr_scanner_savetofiles2 = /** @type {(inputs: Scanner_Savetofiles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer dans Fichiers`)
};

const ar_scanner_savetofiles2 = /** @type {(inputs: Scanner_Savetofiles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ في الملفات`)
};

/**
* | output |
* | --- |
* | "Save to Files" |
*
* @param {Scanner_Savetofiles2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_savetofiles2 = /** @type {((inputs?: Scanner_Savetofiles2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Savetofiles2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_savetofiles2(inputs)
	if (locale === "es") return es_scanner_savetofiles2(inputs)
	if (locale === "fr") return fr_scanner_savetofiles2(inputs)
	return ar_scanner_savetofiles2(inputs)
});
export { scanner_savetofiles2 as "scanner.saveToFiles" }