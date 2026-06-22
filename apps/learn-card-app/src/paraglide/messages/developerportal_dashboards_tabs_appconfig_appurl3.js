/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Appurl3Inputs */

const en_developerportal_dashboards_tabs_appconfig_appurl3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Appurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App URL`)
};

const es_developerportal_dashboards_tabs_appconfig_appurl3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Appurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de la App`)
};

const fr_developerportal_dashboards_tabs_appconfig_appurl3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Appurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de l'App`)
};

const ar_developerportal_dashboards_tabs_appconfig_appurl3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Appurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط التطبيق`)
};

/**
* | output |
* | --- |
* | "App URL" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Appurl3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_appurl3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Appurl3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Appurl3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_appurl3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_appurl3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_appurl3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_appurl3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_appurl3 as "developerPortal.dashboards.tabs.appConfig.appUrl" }