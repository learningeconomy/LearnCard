/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Importcredentialslabel3Inputs */

const en_admintools_importcredentialslabel3 = /** @type {(inputs: Admintools_Importcredentialslabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import Credentials`)
};

const es_admintools_importcredentialslabel3 = /** @type {(inputs: Admintools_Importcredentialslabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importar Credenciales`)
};

const fr_admintools_importcredentialslabel3 = /** @type {(inputs: Admintools_Importcredentialslabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer des justificatifs`)
};

const ar_admintools_importcredentialslabel3 = /** @type {(inputs: Admintools_Importcredentialslabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import Credentials`)
};

/**
* | output |
* | --- |
* | "Import Credentials" |
*
* @param {Admintools_Importcredentialslabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_importcredentialslabel3 = /** @type {((inputs?: Admintools_Importcredentialslabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Importcredentialslabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_importcredentialslabel3(inputs)
	if (locale === "es") return es_admintools_importcredentialslabel3(inputs)
	if (locale === "fr") return fr_admintools_importcredentialslabel3(inputs)
	return ar_admintools_importcredentialslabel3(inputs)
});
export { admintools_importcredentialslabel3 as "adminTools.importCredentialsLabel" }