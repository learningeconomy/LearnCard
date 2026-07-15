/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Assignparenttitle4Inputs */

const en_admintools_bulkimport_assignparenttitle4 = /** @type {(inputs: Admintools_Bulkimport_Assignparenttitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assign a Parent Credential`)
};

const es_admintools_bulkimport_assignparenttitle4 = /** @type {(inputs: Admintools_Bulkimport_Assignparenttitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asignar una Credencial Padre`)
};

const fr_admintools_bulkimport_assignparenttitle4 = /** @type {(inputs: Admintools_Bulkimport_Assignparenttitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Attribuer un justificatif parent`)
};

const ar_admintools_bulkimport_assignparenttitle4 = /** @type {(inputs: Admintools_Bulkimport_Assignparenttitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assign a Parent Credential`)
};

/**
* | output |
* | --- |
* | "Assign a Parent Credential" |
*
* @param {Admintools_Bulkimport_Assignparenttitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_assignparenttitle4 = /** @type {((inputs?: Admintools_Bulkimport_Assignparenttitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Assignparenttitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_assignparenttitle4(inputs)
	if (locale === "es") return es_admintools_bulkimport_assignparenttitle4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_assignparenttitle4(inputs)
	return ar_admintools_bulkimport_assignparenttitle4(inputs)
});
export { admintools_bulkimport_assignparenttitle4 as "adminTools.bulkImport.assignParentTitle" }