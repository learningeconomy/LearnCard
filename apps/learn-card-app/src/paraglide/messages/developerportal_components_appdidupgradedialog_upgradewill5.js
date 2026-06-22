/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdidupgradedialog_Upgradewill5Inputs */

const en_developerportal_components_appdidupgradedialog_upgradewill5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradewill5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This upgrade will:`)
};

const es_developerportal_components_appdidupgradedialog_upgradewill5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradewill5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This upgrade will:`)
};

const fr_developerportal_components_appdidupgradedialog_upgradewill5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradewill5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This upgrade will:`)
};

const ar_developerportal_components_appdidupgradedialog_upgradewill5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradewill5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This upgrade will:`)
};

/**
* | output |
* | --- |
* | "This upgrade will:" |
*
* @param {Developerportal_Components_Appdidupgradedialog_Upgradewill5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_upgradewill5 = /** @type {((inputs?: Developerportal_Components_Appdidupgradedialog_Upgradewill5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Upgradewill5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_upgradewill5(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_upgradewill5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_upgradewill5(inputs)
	return ar_developerportal_components_appdidupgradedialog_upgradewill5(inputs)
});
export { developerportal_components_appdidupgradedialog_upgradewill5 as "developerPortal.components.appDidUpgradeDialog.upgradeWill" }