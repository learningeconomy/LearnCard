/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httplocalhost4Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_httplocalhost4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httplocalhost4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTP okay for localhost`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_httplocalhost4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httplocalhost4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTP está bien para localhost`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_httplocalhost4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httplocalhost4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTP OK pour localhost`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_httplocalhost4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httplocalhost4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTP مقبول لـ localhost`)
};

/**
* | output |
* | --- |
* | "HTTP okay for localhost" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httplocalhost4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_httplocalhost4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httplocalhost4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httplocalhost4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_httplocalhost4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_httplocalhost4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_httplocalhost4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_httplocalhost4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_httplocalhost4 as "developerPortal.dashboards.tabs.appConfig.checkResults.httpLocalhost" }