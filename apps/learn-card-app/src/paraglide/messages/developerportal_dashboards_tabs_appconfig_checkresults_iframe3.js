/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Iframe3Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_iframe3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Iframe3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iframe Embedding`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_iframe3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Iframe3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Incrustación en Iframe`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_iframe3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Iframe3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intégration Iframe`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_iframe3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Iframe3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تضمين Iframe`)
};

/**
* | output |
* | --- |
* | "Iframe Embedding" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Iframe3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_iframe3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Iframe3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Iframe3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_iframe3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_iframe3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_iframe3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_iframe3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_iframe3 as "developerPortal.dashboards.tabs.appConfig.checkResults.iframe" }