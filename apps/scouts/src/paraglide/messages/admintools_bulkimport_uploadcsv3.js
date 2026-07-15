/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Uploadcsv3Inputs */

const en_admintools_bulkimport_uploadcsv3 = /** @type {(inputs: Admintools_Bulkimport_Uploadcsv3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload Your .csv File`)
};

const es_admintools_bulkimport_uploadcsv3 = /** @type {(inputs: Admintools_Bulkimport_Uploadcsv3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube Tu Archivo .csv`)
};

const fr_admintools_bulkimport_uploadcsv3 = /** @type {(inputs: Admintools_Bulkimport_Uploadcsv3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargez votre fichier .csv`)
};

const ar_admintools_bulkimport_uploadcsv3 = /** @type {(inputs: Admintools_Bulkimport_Uploadcsv3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload Your .csv File`)
};

/**
* | output |
* | --- |
* | "Upload Your .csv File" |
*
* @param {Admintools_Bulkimport_Uploadcsv3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_uploadcsv3 = /** @type {((inputs?: Admintools_Bulkimport_Uploadcsv3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Uploadcsv3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_uploadcsv3(inputs)
	if (locale === "es") return es_admintools_bulkimport_uploadcsv3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_uploadcsv3(inputs)
	return ar_admintools_bulkimport_uploadcsv3(inputs)
});
export { admintools_bulkimport_uploadcsv3 as "adminTools.bulkImport.uploadCsv" }