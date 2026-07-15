/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Importcredentialstitle3Inputs */

const en_admintools_importcredentialstitle3 = /** @type {(inputs: Admintools_Importcredentialstitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bulk Import Credentials`)
};

const es_admintools_importcredentialstitle3 = /** @type {(inputs: Admintools_Importcredentialstitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importación Masiva de Credenciales`)
};

const fr_admintools_importcredentialstitle3 = /** @type {(inputs: Admintools_Importcredentialstitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importation en masse de justificatifs`)
};

const ar_admintools_importcredentialstitle3 = /** @type {(inputs: Admintools_Importcredentialstitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bulk Import Credentials`)
};

/**
* | output |
* | --- |
* | "Bulk Import Credentials" |
*
* @param {Admintools_Importcredentialstitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_importcredentialstitle3 = /** @type {((inputs?: Admintools_Importcredentialstitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Importcredentialstitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_importcredentialstitle3(inputs)
	if (locale === "es") return es_admintools_importcredentialstitle3(inputs)
	if (locale === "fr") return fr_admintools_importcredentialstitle3(inputs)
	return ar_admintools_importcredentialstitle3(inputs)
});
export { admintools_importcredentialstitle3 as "adminTools.importCredentialsTitle" }