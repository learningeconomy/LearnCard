/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Bulkimport_Previewcredentials3Inputs */

const en_admintools_bulkimport_previewcredentials3 = /** @type {(inputs: Admintools_Bulkimport_Previewcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview {count} Credentials`)
};

const es_admintools_bulkimport_previewcredentials3 = /** @type {(inputs: Admintools_Bulkimport_Previewcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa de {count} Credenciales`)
};

const fr_admintools_bulkimport_previewcredentials3 = /** @type {(inputs: Admintools_Bulkimport_Previewcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu de {count} justificatifs`)
};

const ar_admintools_bulkimport_previewcredentials3 = /** @type {(inputs: Admintools_Bulkimport_Previewcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة {count} مؤهل`)
};

/**
* | output |
* | --- |
* | "Preview {count} Credentials" |
*
* @param {Admintools_Bulkimport_Previewcredentials3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_bulkimport_previewcredentials3 = /** @type {((inputs?: Admintools_Bulkimport_Previewcredentials3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Bulkimport_Previewcredentials3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_bulkimport_previewcredentials3(inputs)
	if (locale === "es") return es_admintools_bulkimport_previewcredentials3(inputs)
	if (locale === "fr") return fr_admintools_bulkimport_previewcredentials3(inputs)
	return ar_admintools_bulkimport_previewcredentials3(inputs)
});
export { admintools_bulkimport_previewcredentials3 as "adminTools.bulkImport.previewCredentials" }