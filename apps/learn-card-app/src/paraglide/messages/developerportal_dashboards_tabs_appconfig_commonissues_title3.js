/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Commonissues_Title3Inputs */

const en_developerportal_dashboards_tabs_appconfig_commonissues_title3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Commonissues_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Common Issues`)
};

const es_developerportal_dashboards_tabs_appconfig_commonissues_title3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Commonissues_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Problemas Comunes`)
};

const fr_developerportal_dashboards_tabs_appconfig_commonissues_title3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Commonissues_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Problèmes Courants`)
};

const ar_developerportal_dashboards_tabs_appconfig_commonissues_title3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Commonissues_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المشكلات الشائعة`)
};

/**
* | output |
* | --- |
* | "Common Issues" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Commonissues_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_commonissues_title3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Commonissues_Title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Commonissues_Title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_commonissues_title3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_commonissues_title3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_commonissues_title3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_commonissues_title3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_commonissues_title3 as "developerPortal.dashboards.tabs.appConfig.commonIssues.title" }