/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Zipdescription3Inputs */

const en_admintools_bulkimport_zipdescription3 = /** @type {(inputs: Admintools_Bulkimport_Zipdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`If you used filenames instead of URLs, upload a ZIP file containing those image files.`)
};

const es_admintools_bulkimport_zipdescription3 = /** @type {(inputs: Admintools_Bulkimport_Zipdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si usaste nombres de archivo en lugar de URLs, sube un archivo ZIP con esos archivos de imagen.`)
};

const fr_admintools_bulkimport_zipdescription3 = /** @type {(inputs: Admintools_Bulkimport_Zipdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si vous avez utilisé des noms de fichier au lieu d'URL, téléchargez un fichier ZIP contenant ces fichiers image.`)
};

const ar_admintools_bulkimport_zipdescription3 = /** @type {(inputs: Admintools_Bulkimport_Zipdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`If you used filenames instead of URLs, upload a ZIP file containing those image files.`)
};

/**
* | output |
* | --- |
* | "If you used filenames instead of URLs, upload a ZIP file containing those image files." |
*
* @param {Admintools_Bulkimport_Zipdescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_zipdescription3 = /** @type {((inputs?: Admintools_Bulkimport_Zipdescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Zipdescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_zipdescription3(inputs)
	if (locale === "es") return es_admintools_bulkimport_zipdescription3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_zipdescription3(inputs)
	return ar_admintools_bulkimport_zipdescription3(inputs)
});
export { admintools_bulkimport_zipdescription3 as "adminTools.bulkImport.zipDescription" }