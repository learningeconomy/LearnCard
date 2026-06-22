/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Totalissueddesc3Inputs */

const en_developerportal_dashboards_tabs_analytics_totalissueddesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Totalissueddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`credentials all time`)
};

const es_developerportal_dashboards_tabs_analytics_totalissueddesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Totalissueddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`credenciales de todos los tiempos`)
};

const fr_developerportal_dashboards_tabs_analytics_totalissueddesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Totalissueddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`credentials de tous les temps`)
};

const ar_developerportal_dashboards_tabs_analytics_totalissueddesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Totalissueddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بيانات اعتماد على الإطلاق`)
};

/**
* | output |
* | --- |
* | "credentials all time" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Totalissueddesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_totalissueddesc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Totalissueddesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Totalissueddesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_totalissueddesc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_totalissueddesc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_totalissueddesc3(inputs)
	return ar_developerportal_dashboards_tabs_analytics_totalissueddesc3(inputs)
});
export { developerportal_dashboards_tabs_analytics_totalissueddesc3 as "developerPortal.dashboards.tabs.analytics.totalIssuedDesc" }