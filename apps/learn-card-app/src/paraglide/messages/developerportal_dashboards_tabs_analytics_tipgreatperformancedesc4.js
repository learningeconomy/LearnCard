/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformancedesc4Inputs */

const en_developerportal_dashboards_tabs_analytics_tipgreatperformancedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformancedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your claim rate is excellent. Keep up the good work!`)
};

const es_developerportal_dashboards_tabs_analytics_tipgreatperformancedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformancedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu tasa de reclamo es excelente. ¡Sigue así!`)
};

const fr_developerportal_dashboards_tabs_analytics_tipgreatperformancedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformancedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre taux de réclamation est excellent. Continuez comme ça !`)
};

const ar_developerportal_dashboards_tabs_analytics_tipgreatperformancedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformancedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معدل المطالبة الخاص بك ممتاز. استمر في العمل الجيد!`)
};

/**
* | output |
* | --- |
* | "Your claim rate is excellent. Keep up the good work!" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformancedesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_tipgreatperformancedesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformancedesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Tipgreatperformancedesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_tipgreatperformancedesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_tipgreatperformancedesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_tipgreatperformancedesc4(inputs)
	return ar_developerportal_dashboards_tabs_analytics_tipgreatperformancedesc4(inputs)
});
export { developerportal_dashboards_tabs_analytics_tipgreatperformancedesc4 as "developerPortal.dashboards.tabs.analytics.tipGreatPerformanceDesc" }