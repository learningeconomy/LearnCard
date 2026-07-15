/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Uploadingimages3Inputs */

const en_admintools_bulkimport_uploadingimages3 = /** @type {(inputs: Admintools_Bulkimport_Uploadingimages3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uploading images ({progress}%)...`)
};

const es_admintools_bulkimport_uploadingimages3 = /** @type {(inputs: Admintools_Bulkimport_Uploadingimages3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subiendo imágenes ({progress}%)...`)
};

const fr_admintools_bulkimport_uploadingimages3 = /** @type {(inputs: Admintools_Bulkimport_Uploadingimages3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargement des images ({progress}%)...`)
};

const ar_admintools_bulkimport_uploadingimages3 = /** @type {(inputs: Admintools_Bulkimport_Uploadingimages3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uploading images ({progress}%)...`)
};

/**
* | output |
* | --- |
* | "Uploading images ({progress}%)..." |
*
* @param {Admintools_Bulkimport_Uploadingimages3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_uploadingimages3 = /** @type {((inputs?: Admintools_Bulkimport_Uploadingimages3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Uploadingimages3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_uploadingimages3(inputs)
	if (locale === "es") return es_admintools_bulkimport_uploadingimages3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_uploadingimages3(inputs)
	return ar_admintools_bulkimport_uploadingimages3(inputs)
});
export { admintools_bulkimport_uploadingimages3 as "adminTools.bulkImport.uploadingImages" }