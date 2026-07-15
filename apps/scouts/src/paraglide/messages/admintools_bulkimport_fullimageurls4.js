/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Fullimageurls4Inputs */

const en_admintools_bulkimport_fullimageurls4 = /** @type {(inputs: Admintools_Bulkimport_Fullimageurls4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full image URLs (https://...) for direct use`)
};

const es_admintools_bulkimport_fullimageurls4 = /** @type {(inputs: Admintools_Bulkimport_Fullimageurls4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URLs de imagen completas (https://...) para uso directo`)
};

const fr_admintools_bulkimport_fullimageurls4 = /** @type {(inputs: Admintools_Bulkimport_Fullimageurls4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL d'images complètes (https://...) pour une utilisation directe`)
};

const ar_admintools_bulkimport_fullimageurls4 = /** @type {(inputs: Admintools_Bulkimport_Fullimageurls4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`روابط الصور الكاملة (https://...) للاستخدام المباشر`)
};

/**
* | output |
* | --- |
* | "Full image URLs (https://...) for direct use" |
*
* @param {Admintools_Bulkimport_Fullimageurls4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_fullimageurls4 = /** @type {((inputs?: Admintools_Bulkimport_Fullimageurls4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Fullimageurls4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_fullimageurls4(inputs)
	if (locale === "es") return es_admintools_bulkimport_fullimageurls4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_fullimageurls4(inputs)
	return ar_admintools_bulkimport_fullimageurls4(inputs)
});
export { admintools_bulkimport_fullimageurls4 as "adminTools.bulkImport.fullImageUrls" }