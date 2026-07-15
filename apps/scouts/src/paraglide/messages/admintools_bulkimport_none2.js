/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_None2Inputs */

const en_admintools_bulkimport_none2 = /** @type {(inputs: Admintools_Bulkimport_None2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[none]`)
};

const es_admintools_bulkimport_none2 = /** @type {(inputs: Admintools_Bulkimport_None2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[ninguno]`)
};

const fr_admintools_bulkimport_none2 = /** @type {(inputs: Admintools_Bulkimport_None2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[aucun]`)
};

const ar_admintools_bulkimport_none2 = /** @type {(inputs: Admintools_Bulkimport_None2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[لا شيء]`)
};

/**
* | output |
* | --- |
* | "[none]" |
*
* @param {Admintools_Bulkimport_None2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_none2 = /** @type {((inputs?: Admintools_Bulkimport_None2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_None2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_none2(inputs)
	if (locale === "es") return es_admintools_bulkimport_none2(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_none2(inputs)
	return ar_admintools_bulkimport_none2(inputs)
});
export { admintools_bulkimport_none2 as "adminTools.bulkImport.none" }