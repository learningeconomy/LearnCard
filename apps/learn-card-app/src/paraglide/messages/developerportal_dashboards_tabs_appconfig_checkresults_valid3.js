/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Valid3Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_valid3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Valid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valid URL Format`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_valid3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Valid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Formato de URL Válido`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_valid3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Valid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Format d'URL Valide`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_valid3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Valid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنسيق رابط صالح`)
};

/**
* | output |
* | --- |
* | "Valid URL Format" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Valid3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_valid3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Valid3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Valid3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_valid3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_valid3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_valid3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_valid3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_valid3 as "developerPortal.dashboards.tabs.appConfig.checkResults.valid" }