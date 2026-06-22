/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpspass4Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_httpspass4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpspass4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Using secure HTTPS`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_httpspass4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpspass4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usando HTTPS seguro`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_httpspass4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpspass4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisation HTTPS sécurisé`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_httpspass4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpspass4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدام HTTPS آمن`)
};

/**
* | output |
* | --- |
* | "Using secure HTTPS" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpspass4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_httpspass4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpspass4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpspass4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_httpspass4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_httpspass4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_httpspass4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_httpspass4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_httpspass4 as "developerPortal.dashboards.tabs.appConfig.checkResults.httpsPass" }