/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Browsecredentials3Inputs */

const en_admintools_bulkimport_browsecredentials3 = /** @type {(inputs: Admintools_Bulkimport_Browsecredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse Credentials`)
};

const es_admintools_bulkimport_browsecredentials3 = /** @type {(inputs: Admintools_Bulkimport_Browsecredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar Credenciales`)
};

const fr_admintools_bulkimport_browsecredentials3 = /** @type {(inputs: Admintools_Bulkimport_Browsecredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcourir les justificatifs`)
};

const ar_admintools_bulkimport_browsecredentials3 = /** @type {(inputs: Admintools_Bulkimport_Browsecredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse Credentials`)
};

/**
* | output |
* | --- |
* | "Browse Credentials" |
*
* @param {Admintools_Bulkimport_Browsecredentials3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_browsecredentials3 = /** @type {((inputs?: Admintools_Bulkimport_Browsecredentials3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Browsecredentials3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_browsecredentials3(inputs)
	if (locale === "es") return es_admintools_bulkimport_browsecredentials3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_browsecredentials3(inputs)
	return ar_admintools_bulkimport_browsecredentials3(inputs)
});
export { admintools_bulkimport_browsecredentials3 as "adminTools.bulkImport.browseCredentials" }