/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Invalidurl4Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_invalidurl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Invalidurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid URL`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_invalidurl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Invalidurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL inválida`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_invalidurl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Invalidurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL invalide`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_invalidurl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Invalidurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط غير صالح`)
};

/**
* | output |
* | --- |
* | "Invalid URL" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Invalidurl4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_invalidurl4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Invalidurl4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Invalidurl4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_invalidurl4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_invalidurl4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_invalidurl4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_invalidurl4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_invalidurl4 as "developerPortal.dashboards.tabs.appConfig.checkResults.invalidUrl" }