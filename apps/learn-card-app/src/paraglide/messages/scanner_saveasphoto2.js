/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Saveasphoto2Inputs */

const en_scanner_saveasphoto2 = /** @type {(inputs: Scanner_Saveasphoto2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save as Photo`)
};

const es_scanner_saveasphoto2 = /** @type {(inputs: Scanner_Saveasphoto2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar como foto`)
};

const fr_scanner_saveasphoto2 = /** @type {(inputs: Scanner_Saveasphoto2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer comme photo`)
};

const ar_scanner_saveasphoto2 = /** @type {(inputs: Scanner_Saveasphoto2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ كصورة`)
};

/**
* | output |
* | --- |
* | "Save as Photo" |
*
* @param {Scanner_Saveasphoto2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_saveasphoto2 = /** @type {((inputs?: Scanner_Saveasphoto2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Saveasphoto2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_saveasphoto2(inputs)
	if (locale === "es") return es_scanner_saveasphoto2(inputs)
	if (locale === "fr") return fr_scanner_saveasphoto2(inputs)
	return ar_scanner_saveasphoto2(inputs)
});
export { scanner_saveasphoto2 as "scanner.saveAsPhoto" }