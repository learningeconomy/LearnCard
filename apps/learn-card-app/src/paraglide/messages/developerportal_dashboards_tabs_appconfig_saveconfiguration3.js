/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Saveconfiguration3Inputs */

const en_developerportal_dashboards_tabs_appconfig_saveconfiguration3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Saveconfiguration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Configuration`)
};

const es_developerportal_dashboards_tabs_appconfig_saveconfiguration3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Saveconfiguration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Save Configuration]`)
};

const fr_developerportal_dashboards_tabs_appconfig_saveconfiguration3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Saveconfiguration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Save Configuration]`)
};

const ar_developerportal_dashboards_tabs_appconfig_saveconfiguration3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Saveconfiguration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Save Configuration]`)
};

/**
* | output |
* | --- |
* | "Save Configuration" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Saveconfiguration3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_saveconfiguration3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Saveconfiguration3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Saveconfiguration3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_saveconfiguration3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_saveconfiguration3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_saveconfiguration3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_saveconfiguration3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_saveconfiguration3 as "developerPortal.dashboards.tabs.appConfig.saveConfiguration" }