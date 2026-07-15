/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Needsupload3Inputs */

const en_admintools_bulkimport_needsupload3 = /** @type {(inputs: Admintools_Bulkimport_Needsupload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Needs Upload`)
};

const es_admintools_bulkimport_needsupload3 = /** @type {(inputs: Admintools_Bulkimport_Needsupload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Necesita Subida`)
};

const fr_admintools_bulkimport_needsupload3 = /** @type {(inputs: Admintools_Bulkimport_Needsupload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nécessite un téléchargement`)
};

const ar_admintools_bulkimport_needsupload3 = /** @type {(inputs: Admintools_Bulkimport_Needsupload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Needs Upload`)
};

/**
* | output |
* | --- |
* | "Needs Upload" |
*
* @param {Admintools_Bulkimport_Needsupload3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_needsupload3 = /** @type {((inputs?: Admintools_Bulkimport_Needsupload3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Needsupload3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_needsupload3(inputs)
	if (locale === "es") return es_admintools_bulkimport_needsupload3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_needsupload3(inputs)
	return ar_admintools_bulkimport_needsupload3(inputs)
});
export { admintools_bulkimport_needsupload3 as "adminTools.bulkImport.needsUpload" }