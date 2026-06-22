/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Totalissued2Inputs */

const en_developerportal_dashboards_tabs_analytics_totalissued2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Totalissued2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total Issued`)
};

const es_developerportal_dashboards_tabs_analytics_totalissued2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Totalissued2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total Emitido`)
};

const fr_developerportal_dashboards_tabs_analytics_totalissued2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Totalissued2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Total Émis`)
};

const ar_developerportal_dashboards_tabs_analytics_totalissued2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Totalissued2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإجمالي المصدر`)
};

/**
* | output |
* | --- |
* | "Total Issued" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Totalissued2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_totalissued2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Totalissued2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Totalissued2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_totalissued2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_totalissued2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_totalissued2(inputs)
	return ar_developerportal_dashboards_tabs_analytics_totalissued2(inputs)
});
export { developerportal_dashboards_tabs_analytics_totalissued2 as "developerPortal.dashboards.tabs.analytics.totalIssued" }