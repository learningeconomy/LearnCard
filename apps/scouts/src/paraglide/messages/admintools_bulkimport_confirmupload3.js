/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Confirmupload3Inputs */

const en_admintools_bulkimport_confirmupload3 = /** @type {(inputs: Admintools_Bulkimport_Confirmupload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to upload {badges} and {boosts} to {network}?`)
};

const es_admintools_bulkimport_confirmupload3 = /** @type {(inputs: Admintools_Bulkimport_Confirmupload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres subir {badges} y {boosts} a {network}?`)
};

const fr_admintools_bulkimport_confirmupload3 = /** @type {(inputs: Admintools_Bulkimport_Confirmupload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir télécharger {badges} et {boosts} vers {network} ?`)
};

const ar_admintools_bulkimport_confirmupload3 = /** @type {(inputs: Admintools_Bulkimport_Confirmupload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to upload {badges} and {boosts} to {network}?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to upload {badges} and {boosts} to {network}?" |
*
* @param {Admintools_Bulkimport_Confirmupload3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_confirmupload3 = /** @type {((inputs?: Admintools_Bulkimport_Confirmupload3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Confirmupload3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_confirmupload3(inputs)
	if (locale === "es") return es_admintools_bulkimport_confirmupload3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_confirmupload3(inputs)
	return ar_admintools_bulkimport_confirmupload3(inputs)
});
export { admintools_bulkimport_confirmupload3 as "adminTools.bulkImport.confirmUpload" }