/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Uploadbutton3Inputs */

const en_admintools_bulkimport_uploadbutton3 = /** @type {(inputs: Admintools_Bulkimport_Uploadbutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload!`)
};

const es_admintools_bulkimport_uploadbutton3 = /** @type {(inputs: Admintools_Bulkimport_Uploadbutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Subir!`)
};

const fr_admintools_bulkimport_uploadbutton3 = /** @type {(inputs: Admintools_Bulkimport_Uploadbutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger !`)
};

const ar_admintools_bulkimport_uploadbutton3 = /** @type {(inputs: Admintools_Bulkimport_Uploadbutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع!`)
};

/**
* | output |
* | --- |
* | "Upload!" |
*
* @param {Admintools_Bulkimport_Uploadbutton3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_uploadbutton3 = /** @type {((inputs?: Admintools_Bulkimport_Uploadbutton3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Uploadbutton3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_uploadbutton3(inputs)
	if (locale === "es") return es_admintools_bulkimport_uploadbutton3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_uploadbutton3(inputs)
	return ar_admintools_bulkimport_uploadbutton3(inputs)
});
export { admintools_bulkimport_uploadbutton3 as "adminTools.bulkImport.uploadButton" }