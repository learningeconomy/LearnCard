/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Toasts_Validzip2Inputs */

const en_admintools_toasts_validzip2 = /** @type {(inputs: Admintools_Toasts_Validzip2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please upload a valid ZIP file`)
};

const es_admintools_toasts_validzip2 = /** @type {(inputs: Admintools_Toasts_Validzip2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor sube un archivo ZIP válido`)
};

const fr_admintools_toasts_validzip2 = /** @type {(inputs: Admintools_Toasts_Validzip2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez télécharger un fichier ZIP valide`)
};

const ar_admintools_toasts_validzip2 = /** @type {(inputs: Admintools_Toasts_Validzip2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى رفع ملف ZIP صالح`)
};

/**
* | output |
* | --- |
* | "Please upload a valid ZIP file" |
*
* @param {Admintools_Toasts_Validzip2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_toasts_validzip2 = /** @type {((inputs?: Admintools_Toasts_Validzip2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Toasts_Validzip2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_toasts_validzip2(inputs)
	if (locale === "es") return es_admintools_toasts_validzip2(inputs)
	if (locale === "fr") return fr_admintools_toasts_validzip2(inputs)
	return ar_admintools_toasts_validzip2(inputs)
});
export { admintools_toasts_validzip2 as "adminTools.toasts.validZip" }