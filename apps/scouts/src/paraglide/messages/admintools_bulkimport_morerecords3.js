/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Morerecords3Inputs */

const en_admintools_bulkimport_morerecords3 = /** @type {(inputs: Admintools_Bulkimport_Morerecords3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...and {count} more records`)
};

const es_admintools_bulkimport_morerecords3 = /** @type {(inputs: Admintools_Bulkimport_Morerecords3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...y {count} registros más`)
};

const fr_admintools_bulkimport_morerecords3 = /** @type {(inputs: Admintools_Bulkimport_Morerecords3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...et {count} autres enregistrements`)
};

const ar_admintools_bulkimport_morerecords3 = /** @type {(inputs: Admintools_Bulkimport_Morerecords3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...and {count} more records`)
};

/**
* | output |
* | --- |
* | "...and {count} more records" |
*
* @param {Admintools_Bulkimport_Morerecords3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_morerecords3 = /** @type {((inputs?: Admintools_Bulkimport_Morerecords3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Morerecords3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_morerecords3(inputs)
	if (locale === "es") return es_admintools_bulkimport_morerecords3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_morerecords3(inputs)
	return ar_admintools_bulkimport_morerecords3(inputs)
});
export { admintools_bulkimport_morerecords3 as "adminTools.bulkImport.moreRecords" }