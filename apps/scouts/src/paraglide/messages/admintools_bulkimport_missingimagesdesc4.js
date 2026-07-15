/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Missingimagesdesc4Inputs */

const en_admintools_bulkimport_missingimagesdesc4 = /** @type {(inputs: Admintools_Bulkimport_Missingimagesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The following records are missing image URLs:`)
};

const es_admintools_bulkimport_missingimagesdesc4 = /** @type {(inputs: Admintools_Bulkimport_Missingimagesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los siguientes registros no tienen URLs de imagen:`)
};

const fr_admintools_bulkimport_missingimagesdesc4 = /** @type {(inputs: Admintools_Bulkimport_Missingimagesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les enregistrements suivants n'ont pas d'URL d'image :`)
};

const ar_admintools_bulkimport_missingimagesdesc4 = /** @type {(inputs: Admintools_Bulkimport_Missingimagesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The following records are missing image URLs:`)
};

/**
* | output |
* | --- |
* | "The following records are missing image URLs:" |
*
* @param {Admintools_Bulkimport_Missingimagesdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_missingimagesdesc4 = /** @type {((inputs?: Admintools_Bulkimport_Missingimagesdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Missingimagesdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_missingimagesdesc4(inputs)
	if (locale === "es") return es_admintools_bulkimport_missingimagesdesc4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_missingimagesdesc4(inputs)
	return ar_admintools_bulkimport_missingimagesdesc4(inputs)
});
export { admintools_bulkimport_missingimagesdesc4 as "adminTools.bulkImport.missingImagesDesc" }