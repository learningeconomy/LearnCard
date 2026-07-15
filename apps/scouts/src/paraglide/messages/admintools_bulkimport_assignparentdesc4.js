/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Assignparentdesc4Inputs */

const en_admintools_bulkimport_assignparentdesc4 = /** @type {(inputs: Admintools_Bulkimport_Assignparentdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select the credential that these credentials will be created under.`)
};

const es_admintools_bulkimport_assignparentdesc4 = /** @type {(inputs: Admintools_Bulkimport_Assignparentdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona la credencial bajo la cual se crearán estas credenciales.`)
};

const fr_admintools_bulkimport_assignparentdesc4 = /** @type {(inputs: Admintools_Bulkimport_Assignparentdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez le justificatif sous lequel ces justificatifs seront créés.`)
};

const ar_admintools_bulkimport_assignparentdesc4 = /** @type {(inputs: Admintools_Bulkimport_Assignparentdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر المؤهل الذي سيتم إنشاء هذه المؤهلات تحته.`)
};

/**
* | output |
* | --- |
* | "Select the credential that these credentials will be created under." |
*
* @param {Admintools_Bulkimport_Assignparentdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_assignparentdesc4 = /** @type {((inputs?: Admintools_Bulkimport_Assignparentdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Assignparentdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_assignparentdesc4(inputs)
	if (locale === "es") return es_admintools_bulkimport_assignparentdesc4(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_assignparentdesc4(inputs)
	return ar_admintools_bulkimport_assignparentdesc4(inputs)
});
export { admintools_bulkimport_assignparentdesc4 as "adminTools.bulkImport.assignParentDesc" }