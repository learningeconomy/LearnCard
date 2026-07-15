/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Network2Inputs */

const en_admintools_bulkimport_network2 = /** @type {(inputs: Admintools_Bulkimport_Network2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network`)
};

const es_admintools_bulkimport_network2 = /** @type {(inputs: Admintools_Bulkimport_Network2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Red`)
};

const fr_admintools_bulkimport_network2 = /** @type {(inputs: Admintools_Bulkimport_Network2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau`)
};

const ar_admintools_bulkimport_network2 = /** @type {(inputs: Admintools_Bulkimport_Network2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشبكة`)
};

/**
* | output |
* | --- |
* | "Network" |
*
* @param {Admintools_Bulkimport_Network2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_network2 = /** @type {((inputs?: Admintools_Bulkimport_Network2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Network2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_network2(inputs)
	if (locale === "es") return es_admintools_bulkimport_network2(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_network2(inputs)
	return ar_admintools_bulkimport_network2(inputs)
});
export { admintools_bulkimport_network2 as "adminTools.bulkImport.network" }