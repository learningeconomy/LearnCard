/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdidupgradedialog_Upgrading4Inputs */

const en_developerportal_components_appdidupgradedialog_upgrading4 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgrading4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upgrading...`)
};

const es_developerportal_components_appdidupgradedialog_upgrading4 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgrading4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizando...`)
};

const fr_developerportal_components_appdidupgradedialog_upgrading4 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgrading4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mise à jour en cours...`)
};

const ar_developerportal_components_appdidupgradedialog_upgrading4 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgrading4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الترقية...`)
};

/**
* | output |
* | --- |
* | "Upgrading..." |
*
* @param {Developerportal_Components_Appdidupgradedialog_Upgrading4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_upgrading4 = /** @type {((inputs?: Developerportal_Components_Appdidupgradedialog_Upgrading4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Upgrading4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_upgrading4(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_upgrading4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_upgrading4(inputs)
	return ar_developerportal_components_appdidupgradedialog_upgrading4(inputs)
});
export { developerportal_components_appdidupgradedialog_upgrading4 as "developerPortal.components.appDidUpgradeDialog.upgrading" }