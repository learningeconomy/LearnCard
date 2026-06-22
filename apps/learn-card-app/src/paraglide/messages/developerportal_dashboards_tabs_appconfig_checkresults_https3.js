/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Https3Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_https3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Https3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTPS Protocol`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_https3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Https3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Protocolo HTTPS`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_https3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Https3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Protocole HTTPS`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_https3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Https3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بروتوكول HTTPS`)
};

/**
* | output |
* | --- |
* | "HTTPS Protocol" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Https3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_https3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Https3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Https3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_https3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_https3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_https3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_https3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_https3 as "developerPortal.dashboards.tabs.appConfig.checkResults.https" }