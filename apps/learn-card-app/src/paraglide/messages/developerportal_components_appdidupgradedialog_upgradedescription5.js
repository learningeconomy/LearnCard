/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdidupgradedialog_Upgradedescription5Inputs */

const en_developerportal_components_appdidupgradedialog_upgradedescription5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradedescription5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app is using an older authentication method. Upgrading to App DIDs will give your app its own unique identity for issuing credentials, separate from your personal account.`)
};

const es_developerportal_components_appdidupgradedialog_upgradedescription5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradedescription5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app is using an older authentication method. Upgrading to App DIDs will give your app its own unique identity for issuing credentials, separate from your personal account.`)
};

const fr_developerportal_components_appdidupgradedialog_upgradedescription5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradedescription5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app is using an older authentication method. Upgrading to App DIDs will give your app its own unique identity for issuing credentials, separate from your personal account.`)
};

const ar_developerportal_components_appdidupgradedialog_upgradedescription5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradedescription5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app is using an older authentication method. Upgrading to App DIDs will give your app its own unique identity for issuing credentials, separate from your personal account.`)
};

/**
* | output |
* | --- |
* | "Your app is using an older authentication method. Upgrading to App DIDs will give your app its own unique identity for issuing credentials, separate from you..." |
*
* @param {Developerportal_Components_Appdidupgradedialog_Upgradedescription5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_upgradedescription5 = /** @type {((inputs?: Developerportal_Components_Appdidupgradedialog_Upgradedescription5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Upgradedescription5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_upgradedescription5(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_upgradedescription5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_upgradedescription5(inputs)
	return ar_developerportal_components_appdidupgradedialog_upgradedescription5(inputs)
});
export { developerportal_components_appdidupgradedialog_upgradedescription5 as "developerPortal.components.appDidUpgradeDialog.upgradeDescription" }