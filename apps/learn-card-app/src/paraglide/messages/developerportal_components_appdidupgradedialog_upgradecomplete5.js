/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdidupgradedialog_Upgradecomplete5Inputs */

const en_developerportal_components_appdidupgradedialog_upgradecomplete5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradecomplete5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upgrade Complete!`)
};

const es_developerportal_components_appdidupgradedialog_upgradecomplete5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradecomplete5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Actualización Completa!`)
};

const fr_developerportal_components_appdidupgradedialog_upgradecomplete5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradecomplete5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mise à Jour Terminée !`)
};

const ar_developerportal_components_appdidupgradedialog_upgradecomplete5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradecomplete5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتملت الترقية!`)
};

/**
* | output |
* | --- |
* | "Upgrade Complete!" |
*
* @param {Developerportal_Components_Appdidupgradedialog_Upgradecomplete5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_upgradecomplete5 = /** @type {((inputs?: Developerportal_Components_Appdidupgradedialog_Upgradecomplete5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Upgradecomplete5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_upgradecomplete5(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_upgradecomplete5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_upgradecomplete5(inputs)
	return ar_developerportal_components_appdidupgradedialog_upgradecomplete5(inputs)
});
export { developerportal_components_appdidupgradedialog_upgradecomplete5 as "developerPortal.components.appDidUpgradeDialog.upgradeComplete" }