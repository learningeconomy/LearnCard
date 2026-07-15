/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Uploadimageszip4Inputs */

const en_admintools_bulkimport_uploadimageszip4 = /** @type {(inputs: Admintools_Bulkimport_Uploadimageszip4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload Images Zip`)
};

const es_admintools_bulkimport_uploadimageszip4 = /** @type {(inputs: Admintools_Bulkimport_Uploadimageszip4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir ZIP de Imágenes`)
};

const fr_admintools_bulkimport_uploadimageszip4 = /** @type {(inputs: Admintools_Bulkimport_Uploadimageszip4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger le ZIP d'images`)
};

const ar_admintools_bulkimport_uploadimageszip4 = /** @type {(inputs: Admintools_Bulkimport_Uploadimageszip4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload Images Zip`)
};

/**
* | output |
* | --- |
* | "Upload Images Zip" |
*
* @param {Admintools_Bulkimport_Uploadimageszip4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_uploadimageszip4 = /** @type {((inputs?: Admintools_Bulkimport_Uploadimageszip4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Uploadimageszip4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_uploadimageszip4(inputs)
	if (locale === "es") return es_admintools_bulkimport_uploadimageszip4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_uploadimageszip4(inputs)
	return ar_admintools_bulkimport_uploadimageszip4(inputs)
});
export { admintools_bulkimport_uploadimageszip4 as "adminTools.bulkImport.uploadImagesZip" }