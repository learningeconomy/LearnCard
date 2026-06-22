/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Tools_Importcredentials_Description2Inputs */

const en_admintools_tools_importcredentials_description2 = /** @type {(inputs: Admintools_Tools_Importcredentials_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload multiple credentials at once.`)
};

const es_admintools_tools_importcredentials_description2 = /** @type {(inputs: Admintools_Tools_Importcredentials_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube varias credenciales a la vez.`)
};

const fr_admintools_tools_importcredentials_description2 = /** @type {(inputs: Admintools_Tools_Importcredentials_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléversez plusieurs justificatifs à la fois.`)
};

const ar_admintools_tools_importcredentials_description2 = /** @type {(inputs: Admintools_Tools_Importcredentials_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حمّل عدة بيانات اعتماد دفعة واحدة.`)
};

/**
* | output |
* | --- |
* | "Upload multiple credentials at once." |
*
* @param {Admintools_Tools_Importcredentials_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_tools_importcredentials_description2 = /** @type {((inputs?: Admintools_Tools_Importcredentials_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Tools_Importcredentials_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_tools_importcredentials_description2(inputs)
	if (locale === "es") return es_admintools_tools_importcredentials_description2(inputs)
	if (locale === "fr") return fr_admintools_tools_importcredentials_description2(inputs)
	return ar_admintools_tools_importcredentials_description2(inputs)
});
export { admintools_tools_importcredentials_description2 as "adminTools.tools.importCredentials.description" }