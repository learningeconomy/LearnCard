/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Missingimages3Inputs */

const en_admintools_bulkimport_missingimages3 = /** @type {(inputs: Admintools_Bulkimport_Missingimages3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Missing Images`)
};

const es_admintools_bulkimport_missingimages3 = /** @type {(inputs: Admintools_Bulkimport_Missingimages3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imágenes Faltantes`)
};

const fr_admintools_bulkimport_missingimages3 = /** @type {(inputs: Admintools_Bulkimport_Missingimages3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Images manquantes`)
};

const ar_admintools_bulkimport_missingimages3 = /** @type {(inputs: Admintools_Bulkimport_Missingimages3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صور مفقودة`)
};

/**
* | output |
* | --- |
* | "Missing Images" |
*
* @param {Admintools_Bulkimport_Missingimages3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_missingimages3 = /** @type {((inputs?: Admintools_Bulkimport_Missingimages3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Missingimages3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_missingimages3(inputs)
	if (locale === "es") return es_admintools_bulkimport_missingimages3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_missingimages3(inputs)
	return ar_admintools_bulkimport_missingimages3(inputs)
});
export { admintools_bulkimport_missingimages3 as "adminTools.bulkImport.missingImages" }