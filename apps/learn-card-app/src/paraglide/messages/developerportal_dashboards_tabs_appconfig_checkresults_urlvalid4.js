/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Urlvalid4Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_urlvalid4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Urlvalid4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL is valid`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_urlvalid4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Urlvalid4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La URL es válida`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_urlvalid4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Urlvalid4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'URL est valide`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_urlvalid4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Urlvalid4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الرابط صالح`)
};

/**
* | output |
* | --- |
* | "URL is valid" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Urlvalid4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_urlvalid4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Urlvalid4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Urlvalid4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_urlvalid4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_urlvalid4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_urlvalid4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_urlvalid4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_urlvalid4 as "developerPortal.dashboards.tabs.appConfig.checkResults.urlValid" }