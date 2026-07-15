/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Pagetitle3Inputs */

const en_admintools_bulkimport_pagetitle3 = /** @type {(inputs: Admintools_Bulkimport_Pagetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bulk Boost Import`)
};

const es_admintools_bulkimport_pagetitle3 = /** @type {(inputs: Admintools_Bulkimport_Pagetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importación Masiva de Boosts`)
};

const fr_admintools_bulkimport_pagetitle3 = /** @type {(inputs: Admintools_Bulkimport_Pagetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importation en masse de Boosts`)
};

const ar_admintools_bulkimport_pagetitle3 = /** @type {(inputs: Admintools_Bulkimport_Pagetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bulk Boost Import`)
};

/**
* | output |
* | --- |
* | "Bulk Boost Import" |
*
* @param {Admintools_Bulkimport_Pagetitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_pagetitle3 = /** @type {((inputs?: Admintools_Bulkimport_Pagetitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Pagetitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_pagetitle3(inputs)
	if (locale === "es") return es_admintools_bulkimport_pagetitle3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_pagetitle3(inputs)
	return ar_admintools_bulkimport_pagetitle3(inputs)
});
export { admintools_bulkimport_pagetitle3 as "adminTools.bulkImport.pageTitle" }