/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Importcredentialsdesc3Inputs */

const en_admintools_importcredentialsdesc3 = /** @type {(inputs: Admintools_Importcredentialsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload multiple credentials at once.`)
};

const es_admintools_importcredentialsdesc3 = /** @type {(inputs: Admintools_Importcredentialsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube múltiples credenciales a la vez.`)
};

const fr_admintools_importcredentialsdesc3 = /** @type {(inputs: Admintools_Importcredentialsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargez plusieurs justificatifs à la fois.`)
};

const ar_admintools_importcredentialsdesc3 = /** @type {(inputs: Admintools_Importcredentialsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع مؤهلات متعددة دفعة واحدة.`)
};

/**
* | output |
* | --- |
* | "Upload multiple credentials at once." |
*
* @param {Admintools_Importcredentialsdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_importcredentialsdesc3 = /** @type {((inputs?: Admintools_Importcredentialsdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Importcredentialsdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_importcredentialsdesc3(inputs)
	if (locale === "es") return es_admintools_importcredentialsdesc3(inputs)
	if (locale === "fr") return fr_admintools_importcredentialsdesc3(inputs)
	return ar_admintools_importcredentialsdesc3(inputs)
});
export { admintools_importcredentialsdesc3 as "adminTools.importCredentialsDesc" }