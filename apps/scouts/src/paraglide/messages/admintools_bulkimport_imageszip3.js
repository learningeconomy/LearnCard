/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Imageszip3Inputs */

const en_admintools_bulkimport_imageszip3 = /** @type {(inputs: Admintools_Bulkimport_Imageszip3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Images ZIP:`)
};

const es_admintools_bulkimport_imageszip3 = /** @type {(inputs: Admintools_Bulkimport_Imageszip3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ZIP de Imágenes:`)
};

const fr_admintools_bulkimport_imageszip3 = /** @type {(inputs: Admintools_Bulkimport_Imageszip3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ZIP d'images :`)
};

const ar_admintools_bulkimport_imageszip3 = /** @type {(inputs: Admintools_Bulkimport_Imageszip3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Images ZIP:`)
};

/**
* | output |
* | --- |
* | "Images ZIP:" |
*
* @param {Admintools_Bulkimport_Imageszip3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_imageszip3 = /** @type {((inputs?: Admintools_Bulkimport_Imageszip3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Imageszip3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_imageszip3(inputs)
	if (locale === "es") return es_admintools_bulkimport_imageszip3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_imageszip3(inputs)
	return ar_admintools_bulkimport_imageszip3(inputs)
});
export { admintools_bulkimport_imageszip3 as "adminTools.bulkImport.imagesZip" }