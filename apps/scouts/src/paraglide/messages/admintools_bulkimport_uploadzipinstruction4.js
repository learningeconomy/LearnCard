/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Uploadzipinstruction4Inputs */

const en_admintools_bulkimport_uploadzipinstruction4 = /** @type {(inputs: Admintools_Bulkimport_Uploadzipinstruction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`4. If you used filenames instead of URLs, upload a ZIP file containing those image files`)
};

const es_admintools_bulkimport_uploadzipinstruction4 = /** @type {(inputs: Admintools_Bulkimport_Uploadzipinstruction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`4. Si usaste nombres de archivo en lugar de URLs, sube un archivo ZIP con esos archivos de imagen`)
};

const fr_admintools_bulkimport_uploadzipinstruction4 = /** @type {(inputs: Admintools_Bulkimport_Uploadzipinstruction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`4. Si vous avez utilisé des noms de fichier au lieu d'URL, téléchargez un fichier ZIP contenant ces fichiers image`)
};

const ar_admintools_bulkimport_uploadzipinstruction4 = /** @type {(inputs: Admintools_Bulkimport_Uploadzipinstruction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`4. If you used filenames instead of URLs, upload a ZIP file containing those image files`)
};

/**
* | output |
* | --- |
* | "4. If you used filenames instead of URLs, upload a ZIP file containing those image files" |
*
* @param {Admintools_Bulkimport_Uploadzipinstruction4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_uploadzipinstruction4 = /** @type {((inputs?: Admintools_Bulkimport_Uploadzipinstruction4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Uploadzipinstruction4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_uploadzipinstruction4(inputs)
	if (locale === "es") return es_admintools_bulkimport_uploadzipinstruction4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_uploadzipinstruction4(inputs)
	return ar_admintools_bulkimport_uploadzipinstruction4(inputs)
});
export { admintools_bulkimport_uploadzipinstruction4 as "adminTools.bulkImport.uploadZipInstruction" }