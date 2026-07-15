/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Toasts_Zipextracterror3Inputs */

const en_admintools_toasts_zipextracterror3 = /** @type {(inputs: Admintools_Toasts_Zipextracterror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error extracting ZIP file`)
};

const es_admintools_toasts_zipextracterror3 = /** @type {(inputs: Admintools_Toasts_Zipextracterror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al extraer el archivo ZIP`)
};

const fr_admintools_toasts_zipextracterror3 = /** @type {(inputs: Admintools_Toasts_Zipextracterror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur lors de l'extraction du fichier ZIP`)
};

const ar_admintools_toasts_zipextracterror3 = /** @type {(inputs: Admintools_Toasts_Zipextracterror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error extracting ZIP file`)
};

/**
* | output |
* | --- |
* | "Error extracting ZIP file" |
*
* @param {Admintools_Toasts_Zipextracterror3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_toasts_zipextracterror3 = /** @type {((inputs?: Admintools_Toasts_Zipextracterror3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Toasts_Zipextracterror3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_toasts_zipextracterror3(inputs)
	if (locale === "es") return es_admintools_toasts_zipextracterror3(inputs)
	if (locale === "fr") return fr_admintools_toasts_zipextracterror3(inputs)
	return ar_admintools_toasts_zipextracterror3(inputs)
});
export { admintools_toasts_zipextracterror3 as "adminTools.toasts.zipExtractError" }