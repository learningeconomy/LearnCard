/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Checkbeforeuploading4Inputs */

const en_admintools_bulkimport_checkbeforeuploading4 = /** @type {(inputs: Admintools_Bulkimport_Checkbeforeuploading4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check Before Uploading`)
};

const es_admintools_bulkimport_checkbeforeuploading4 = /** @type {(inputs: Admintools_Bulkimport_Checkbeforeuploading4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar Antes de Subir`)
};

const fr_admintools_bulkimport_checkbeforeuploading4 = /** @type {(inputs: Admintools_Bulkimport_Checkbeforeuploading4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier avant de télécharger`)
};

const ar_admintools_bulkimport_checkbeforeuploading4 = /** @type {(inputs: Admintools_Bulkimport_Checkbeforeuploading4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check Before Uploading`)
};

/**
* | output |
* | --- |
* | "Check Before Uploading" |
*
* @param {Admintools_Bulkimport_Checkbeforeuploading4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_checkbeforeuploading4 = /** @type {((inputs?: Admintools_Bulkimport_Checkbeforeuploading4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Checkbeforeuploading4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_checkbeforeuploading4(inputs)
	if (locale === "es") return es_admintools_bulkimport_checkbeforeuploading4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_checkbeforeuploading4(inputs)
	return ar_admintools_bulkimport_checkbeforeuploading4(inputs)
});
export { admintools_bulkimport_checkbeforeuploading4 as "adminTools.bulkImport.checkBeforeUploading" }