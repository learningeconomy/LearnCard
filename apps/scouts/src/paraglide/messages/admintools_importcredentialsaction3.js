/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Importcredentialsaction3Inputs */

const en_admintools_importcredentialsaction3 = /** @type {(inputs: Admintools_Importcredentialsaction3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Credentials`)
};

const es_admintools_importcredentialsaction3 = /** @type {(inputs: Admintools_Importcredentialsaction3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Credenciales`)
};

const fr_admintools_importcredentialsaction3 = /** @type {(inputs: Admintools_Importcredentialsaction3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter des justificatifs`)
};

const ar_admintools_importcredentialsaction3 = /** @type {(inputs: Admintools_Importcredentialsaction3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Credentials`)
};

/**
* | output |
* | --- |
* | "Add Credentials" |
*
* @param {Admintools_Importcredentialsaction3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_importcredentialsaction3 = /** @type {((inputs?: Admintools_Importcredentialsaction3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Importcredentialsaction3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_importcredentialsaction3(inputs)
	if (locale === "es") return es_admintools_importcredentialsaction3(inputs)
	if (locale === "fr") return fr_admintools_importcredentialsaction3(inputs)
	return ar_admintools_importcredentialsaction3(inputs)
});
export { admintools_importcredentialsaction3 as "adminTools.importCredentialsAction" }