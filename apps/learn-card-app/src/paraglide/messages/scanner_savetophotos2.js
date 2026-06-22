/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Savetophotos2Inputs */

const en_scanner_savetophotos2 = /** @type {(inputs: Scanner_Savetophotos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save to Photos`)
};

const es_scanner_savetophotos2 = /** @type {(inputs: Scanner_Savetophotos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar en Fotos`)
};

const fr_scanner_savetophotos2 = /** @type {(inputs: Scanner_Savetophotos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer dans Photos`)
};

const ar_scanner_savetophotos2 = /** @type {(inputs: Scanner_Savetophotos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ في الصور`)
};

/**
* | output |
* | --- |
* | "Save to Photos" |
*
* @param {Scanner_Savetophotos2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_savetophotos2 = /** @type {((inputs?: Scanner_Savetophotos2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Savetophotos2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_savetophotos2(inputs)
	if (locale === "es") return es_scanner_savetophotos2(inputs)
	if (locale === "fr") return fr_scanner_savetophotos2(inputs)
	return ar_scanner_savetophotos2(inputs)
});
export { scanner_savetophotos2 as "scanner.saveToPhotos" }