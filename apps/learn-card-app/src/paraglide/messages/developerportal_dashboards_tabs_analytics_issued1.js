/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Issued1Inputs */

const en_developerportal_dashboards_tabs_analytics_issued1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Issued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued`)
};

const es_developerportal_dashboards_tabs_analytics_issued1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Issued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitidas`)
};

const fr_developerportal_dashboards_tabs_analytics_issued1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Issued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émis`)
};

const ar_developerportal_dashboards_tabs_analytics_issued1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Issued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الإصدار`)
};

/**
* | output |
* | --- |
* | "Issued" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Issued1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_issued1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Issued1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Issued1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_issued1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_issued1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_issued1(inputs)
	return ar_developerportal_dashboards_tabs_analytics_issued1(inputs)
});
export { developerportal_dashboards_tabs_analytics_issued1 as "developerPortal.dashboards.tabs.analytics.issued" }