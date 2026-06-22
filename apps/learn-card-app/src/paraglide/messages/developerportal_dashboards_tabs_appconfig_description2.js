/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Description2Inputs */

const en_developerportal_dashboards_tabs_appconfig_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configure your embedded app's URL and permissions`)
};

const es_developerportal_dashboards_tabs_appconfig_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura la URL y los permisos de tu aplicación embebida`)
};

const fr_developerportal_dashboards_tabs_appconfig_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez l'URL et les permissions de votre application embarquée`)
};

const ar_developerportal_dashboards_tabs_appconfig_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكوين رابط التطبيق المضمن والأذونات`)
};

/**
* | output |
* | --- |
* | "Configure your embedded app's URL and permissions" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_description2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_description2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_description2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_description2(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_description2(inputs)
});
export { developerportal_dashboards_tabs_appconfig_description2 as "developerPortal.dashboards.tabs.appConfig.description" }