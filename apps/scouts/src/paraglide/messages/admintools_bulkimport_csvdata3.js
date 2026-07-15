/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Csvdata3Inputs */

const en_admintools_bulkimport_csvdata3 = /** @type {(inputs: Admintools_Bulkimport_Csvdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CSV Data:`)
};

const es_admintools_bulkimport_csvdata3 = /** @type {(inputs: Admintools_Bulkimport_Csvdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datos CSV:`)
};

const fr_admintools_bulkimport_csvdata3 = /** @type {(inputs: Admintools_Bulkimport_Csvdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Données CSV :`)
};

const ar_admintools_bulkimport_csvdata3 = /** @type {(inputs: Admintools_Bulkimport_Csvdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CSV Data:`)
};

/**
* | output |
* | --- |
* | "CSV Data:" |
*
* @param {Admintools_Bulkimport_Csvdata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_csvdata3 = /** @type {((inputs?: Admintools_Bulkimport_Csvdata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Csvdata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_csvdata3(inputs)
	if (locale === "es") return es_admintools_bulkimport_csvdata3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_csvdata3(inputs)
	return ar_admintools_bulkimport_csvdata3(inputs)
});
export { admintools_bulkimport_csvdata3 as "adminTools.bulkImport.csvData" }