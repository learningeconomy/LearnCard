/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdidupgradedialog_Upgradeyourapp6Inputs */

const en_developerportal_components_appdidupgradedialog_upgradeyourapp6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradeyourapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upgrade Your App`)
};

const es_developerportal_components_appdidupgradedialog_upgradeyourapp6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradeyourapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualiza Tu Aplicación`)
};

const fr_developerportal_components_appdidupgradedialog_upgradeyourapp6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradeyourapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mettez à Jour Votre Application`)
};

const ar_developerportal_components_appdidupgradedialog_upgradeyourapp6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradeyourapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ترقية تطبيقك`)
};

/**
* | output |
* | --- |
* | "Upgrade Your App" |
*
* @param {Developerportal_Components_Appdidupgradedialog_Upgradeyourapp6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_upgradeyourapp6 = /** @type {((inputs?: Developerportal_Components_Appdidupgradedialog_Upgradeyourapp6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Upgradeyourapp6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_upgradeyourapp6(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_upgradeyourapp6(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_upgradeyourapp6(inputs)
	return ar_developerportal_components_appdidupgradedialog_upgradeyourapp6(inputs)
});
export { developerportal_components_appdidupgradedialog_upgradeyourapp6 as "developerPortal.components.appDidUpgradeDialog.upgradeYourApp" }