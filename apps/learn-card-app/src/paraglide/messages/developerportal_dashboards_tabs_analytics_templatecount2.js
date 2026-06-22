/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Analytics_Templatecount2Inputs */

const en_developerportal_dashboards_tabs_analytics_templatecount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Templatecount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} active`)
};

const es_developerportal_dashboards_tabs_analytics_templatecount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Templatecount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} activas`)
};

const fr_developerportal_dashboards_tabs_analytics_templatecount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Templatecount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} actifs`)
};

const ar_developerportal_dashboards_tabs_analytics_templatecount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Templatecount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} نشط`)
};

/**
* | output |
* | --- |
* | "{count} active" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Templatecount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_templatecount2 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Analytics_Templatecount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Templatecount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_templatecount2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_templatecount2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_templatecount2(inputs)
	return ar_developerportal_dashboards_tabs_analytics_templatecount2(inputs)
});
export { developerportal_dashboards_tabs_analytics_templatecount2 as "developerPortal.dashboards.tabs.analytics.templateCount" }