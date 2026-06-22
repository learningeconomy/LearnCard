/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Tools_Importcredentials_Label2Inputs */

const en_admintools_tools_importcredentials_label2 = /** @type {(inputs: Admintools_Tools_Importcredentials_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import Credentials`)
};

const es_admintools_tools_importcredentials_label2 = /** @type {(inputs: Admintools_Tools_Importcredentials_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importar credenciales`)
};

const fr_admintools_tools_importcredentials_label2 = /** @type {(inputs: Admintools_Tools_Importcredentials_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer des justificatifs`)
};

const ar_admintools_tools_importcredentials_label2 = /** @type {(inputs: Admintools_Tools_Importcredentials_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استيراد بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Import Credentials" |
*
* @param {Admintools_Tools_Importcredentials_Label2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_tools_importcredentials_label2 = /** @type {((inputs?: Admintools_Tools_Importcredentials_Label2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Tools_Importcredentials_Label2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_tools_importcredentials_label2(inputs)
	if (locale === "es") return es_admintools_tools_importcredentials_label2(inputs)
	if (locale === "fr") return fr_admintools_tools_importcredentials_label2(inputs)
	return ar_admintools_tools_importcredentials_label2(inputs)
});
export { admintools_tools_importcredentials_label2 as "adminTools.tools.importCredentials.label" }