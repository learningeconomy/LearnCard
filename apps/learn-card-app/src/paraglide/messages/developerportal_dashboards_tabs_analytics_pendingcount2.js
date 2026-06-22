/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Analytics_Pendingcount2Inputs */

const en_developerportal_dashboards_tabs_analytics_pendingcount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Pendingcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} pending`)
};

const es_developerportal_dashboards_tabs_analytics_pendingcount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Pendingcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} pendientes`)
};

const fr_developerportal_dashboards_tabs_analytics_pendingcount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Pendingcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} en attente`)
};

const ar_developerportal_dashboards_tabs_analytics_pendingcount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Pendingcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} قيد الانتظار`)
};

/**
* | output |
* | --- |
* | "{count} pending" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Pendingcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_pendingcount2 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Analytics_Pendingcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Pendingcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_pendingcount2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_pendingcount2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_pendingcount2(inputs)
	return ar_developerportal_dashboards_tabs_analytics_pendingcount2(inputs)
});
export { developerportal_dashboards_tabs_analytics_pendingcount2 as "developerPortal.dashboards.tabs.analytics.pendingCount" }