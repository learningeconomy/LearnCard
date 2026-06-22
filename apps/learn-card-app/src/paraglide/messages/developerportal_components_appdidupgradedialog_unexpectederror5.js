/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdidupgradedialog_Unexpectederror5Inputs */

const en_developerportal_components_appdidupgradedialog_unexpectederror5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Unexpectederror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An unexpected error occurred`)
};

const es_developerportal_components_appdidupgradedialog_unexpectederror5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Unexpectederror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error inesperado`)
};

const fr_developerportal_components_appdidupgradedialog_unexpectederror5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Unexpectederror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur inattendue s'est produite`)
};

const ar_developerportal_components_appdidupgradedialog_unexpectederror5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Unexpectederror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ غير متوقع`)
};

/**
* | output |
* | --- |
* | "An unexpected error occurred" |
*
* @param {Developerportal_Components_Appdidupgradedialog_Unexpectederror5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_unexpectederror5 = /** @type {((inputs?: Developerportal_Components_Appdidupgradedialog_Unexpectederror5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Unexpectederror5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_unexpectederror5(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_unexpectederror5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_unexpectederror5(inputs)
	return ar_developerportal_components_appdidupgradedialog_unexpectederror5(inputs)
});
export { developerportal_components_appdidupgradedialog_unexpectederror5 as "developerPortal.components.appDidUpgradeDialog.unexpectedError" }