/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Title2Inputs */

const en_developerportal_dashboards_tabs_appconfig_title2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Configuration`)
};

const es_developerportal_dashboards_tabs_appconfig_title2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración de la App`)
};

const fr_developerportal_dashboards_tabs_appconfig_title2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration de l'App`)
};

const ar_developerportal_dashboards_tabs_appconfig_title2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعدادات التطبيق`)
};

/**
* | output |
* | --- |
* | "App Configuration" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_title2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_title2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_title2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_title2(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_title2(inputs)
});
export { developerportal_dashboards_tabs_appconfig_title2 as "developerPortal.dashboards.tabs.appConfig.title" }