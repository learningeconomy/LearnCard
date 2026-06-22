/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdidupgradedialog_Closedialog5Inputs */

const en_developerportal_components_appdidupgradedialog_closedialog5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Closedialog5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close dialog`)
};

const es_developerportal_components_appdidupgradedialog_closedialog5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Closedialog5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar diálogo`)
};

const fr_developerportal_components_appdidupgradedialog_closedialog5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Closedialog5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer la boîte de dialogue`)
};

const ar_developerportal_components_appdidupgradedialog_closedialog5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Closedialog5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إغلاق الحوار`)
};

/**
* | output |
* | --- |
* | "Close dialog" |
*
* @param {Developerportal_Components_Appdidupgradedialog_Closedialog5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_closedialog5 = /** @type {((inputs?: Developerportal_Components_Appdidupgradedialog_Closedialog5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Closedialog5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_closedialog5(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_closedialog5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_closedialog5(inputs)
	return ar_developerportal_components_appdidupgradedialog_closedialog5(inputs)
});
export { developerportal_components_appdidupgradedialog_closedialog5 as "developerPortal.components.appDidUpgradeDialog.closeDialog" }