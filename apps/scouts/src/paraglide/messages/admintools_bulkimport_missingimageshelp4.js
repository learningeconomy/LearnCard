/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Missingimageshelp4Inputs */

const en_admintools_bulkimport_missingimageshelp4 = /** @type {(inputs: Admintools_Bulkimport_Missingimageshelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please upload a ZIP file containing these images or provide direct URLs in the spreadsheet.`)
};

const es_admintools_bulkimport_missingimageshelp4 = /** @type {(inputs: Admintools_Bulkimport_Missingimageshelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube un archivo ZIP con estas imágenes o proporciona URLs directas en la hoja de cálculo.`)
};

const fr_admintools_bulkimport_missingimageshelp4 = /** @type {(inputs: Admintools_Bulkimport_Missingimageshelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez télécharger un fichier ZIP contenant ces images ou fournir des URL directes dans le tableur.`)
};

const ar_admintools_bulkimport_missingimageshelp4 = /** @type {(inputs: Admintools_Bulkimport_Missingimageshelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please upload a ZIP file containing these images or provide direct URLs in the spreadsheet.`)
};

/**
* | output |
* | --- |
* | "Please upload a ZIP file containing these images or provide direct URLs in the spreadsheet." |
*
* @param {Admintools_Bulkimport_Missingimageshelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_missingimageshelp4 = /** @type {((inputs?: Admintools_Bulkimport_Missingimageshelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Missingimageshelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_missingimageshelp4(inputs)
	if (locale === "es") return es_admintools_bulkimport_missingimageshelp4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_missingimageshelp4(inputs)
	return ar_admintools_bulkimport_missingimageshelp4(inputs)
});
export { admintools_bulkimport_missingimageshelp4 as "adminTools.bulkImport.missingImagesHelp" }