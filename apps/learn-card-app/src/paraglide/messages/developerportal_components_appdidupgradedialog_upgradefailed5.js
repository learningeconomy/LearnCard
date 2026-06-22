/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdidupgradedialog_Upgradefailed5Inputs */

const en_developerportal_components_appdidupgradedialog_upgradefailed5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradefailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upgrade failed. Please try again.`)
};

const es_developerportal_components_appdidupgradedialog_upgradefailed5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradefailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error en la actualización. Inténtalo de nuevo.`)
};

const fr_developerportal_components_appdidupgradedialog_upgradefailed5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradefailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la mise à jour. Veuillez réessayer.`)
};

const ar_developerportal_components_appdidupgradedialog_upgradefailed5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradefailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشلت الترقية. حاول مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Upgrade failed. Please try again." |
*
* @param {Developerportal_Components_Appdidupgradedialog_Upgradefailed5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_upgradefailed5 = /** @type {((inputs?: Developerportal_Components_Appdidupgradedialog_Upgradefailed5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Upgradefailed5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_upgradefailed5(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_upgradefailed5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_upgradefailed5(inputs)
	return ar_developerportal_components_appdidupgradedialog_upgradefailed5(inputs)
});
export { developerportal_components_appdidupgradedialog_upgradefailed5 as "developerPortal.components.appDidUpgradeDialog.upgradeFailed" }