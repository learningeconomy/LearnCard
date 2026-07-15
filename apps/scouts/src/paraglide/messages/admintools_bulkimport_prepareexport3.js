/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Prepareexport3Inputs */

const en_admintools_bulkimport_prepareexport3 = /** @type {(inputs: Admintools_Bulkimport_Prepareexport3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prepare & Export Your File`)
};

const es_admintools_bulkimport_prepareexport3 = /** @type {(inputs: Admintools_Bulkimport_Prepareexport3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preparar y Exportar Tu Archivo`)
};

const fr_admintools_bulkimport_prepareexport3 = /** @type {(inputs: Admintools_Bulkimport_Prepareexport3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Préparez et exportez votre fichier`)
};

const ar_admintools_bulkimport_prepareexport3 = /** @type {(inputs: Admintools_Bulkimport_Prepareexport3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تجهيز وتصدير ملفك`)
};

/**
* | output |
* | --- |
* | "Prepare & Export Your File" |
*
* @param {Admintools_Bulkimport_Prepareexport3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_prepareexport3 = /** @type {((inputs?: Admintools_Bulkimport_Prepareexport3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Prepareexport3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_prepareexport3(inputs)
	if (locale === "es") return es_admintools_bulkimport_prepareexport3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_prepareexport3(inputs)
	return ar_admintools_bulkimport_prepareexport3(inputs)
});
export { admintools_bulkimport_prepareexport3 as "adminTools.bulkImport.prepareExport" }