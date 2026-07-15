/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Validurl3Inputs */

const en_admintools_bulkimport_validurl3 = /** @type {(inputs: Admintools_Bulkimport_Validurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valid URL`)
};

const es_admintools_bulkimport_validurl3 = /** @type {(inputs: Admintools_Bulkimport_Validurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL Válida`)
};

const fr_admintools_bulkimport_validurl3 = /** @type {(inputs: Admintools_Bulkimport_Validurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL valide`)
};

const ar_admintools_bulkimport_validurl3 = /** @type {(inputs: Admintools_Bulkimport_Validurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valid URL`)
};

/**
* | output |
* | --- |
* | "Valid URL" |
*
* @param {Admintools_Bulkimport_Validurl3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_validurl3 = /** @type {((inputs?: Admintools_Bulkimport_Validurl3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Validurl3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_validurl3(inputs)
	if (locale === "es") return es_admintools_bulkimport_validurl3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_validurl3(inputs)
	return ar_admintools_bulkimport_validurl3(inputs)
});
export { admintools_bulkimport_validurl3 as "adminTools.bulkImport.validUrl" }