/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Checkbeforeuploadingdesc5Inputs */

const en_admintools_bulkimport_checkbeforeuploadingdesc5 = /** @type {(inputs: Admintools_Bulkimport_Checkbeforeuploadingdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ensure all images are in place and any file errors are fixed before continuing.`)
};

const es_admintools_bulkimport_checkbeforeuploadingdesc5 = /** @type {(inputs: Admintools_Bulkimport_Checkbeforeuploadingdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asegúrate de que todas las imágenes estén en su lugar y los errores solucionados.`)
};

const fr_admintools_bulkimport_checkbeforeuploadingdesc5 = /** @type {(inputs: Admintools_Bulkimport_Checkbeforeuploadingdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assurez-vous que toutes les images sont en place et que les erreurs de fichier sont corrigées avant de continuer.`)
};

const ar_admintools_bulkimport_checkbeforeuploadingdesc5 = /** @type {(inputs: Admintools_Bulkimport_Checkbeforeuploadingdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ensure all images are in place and any file errors are fixed before continuing.`)
};

/**
* | output |
* | --- |
* | "Ensure all images are in place and any file errors are fixed before continuing." |
*
* @param {Admintools_Bulkimport_Checkbeforeuploadingdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_checkbeforeuploadingdesc5 = /** @type {((inputs?: Admintools_Bulkimport_Checkbeforeuploadingdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Checkbeforeuploadingdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_checkbeforeuploadingdesc5(inputs)
	if (locale === "es") return es_admintools_bulkimport_checkbeforeuploadingdesc5(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_checkbeforeuploadingdesc5(inputs)
	return ar_admintools_bulkimport_checkbeforeuploadingdesc5(inputs)
});
export { admintools_bulkimport_checkbeforeuploadingdesc5 as "adminTools.bulkImport.checkBeforeUploadingDesc" }