/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Unclaimedcredentials2Inputs */

const en_developerportal_dashboards_tabs_analytics_unclaimedcredentials2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Unclaimedcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unclaimed Credentials`)
};

const es_developerportal_dashboards_tabs_analytics_unclaimedcredentials2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Unclaimedcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credenciales Sin Reclamar`)
};

const fr_developerportal_dashboards_tabs_analytics_unclaimedcredentials2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Unclaimedcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials Non Réclamés`)
};

const ar_developerportal_dashboards_tabs_analytics_unclaimedcredentials2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Unclaimedcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بيانات الاعتماد غير المطالب بها`)
};

/**
* | output |
* | --- |
* | "Unclaimed Credentials" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Unclaimedcredentials2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_unclaimedcredentials2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Unclaimedcredentials2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Unclaimedcredentials2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_unclaimedcredentials2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_unclaimedcredentials2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_unclaimedcredentials2(inputs)
	return ar_developerportal_dashboards_tabs_analytics_unclaimedcredentials2(inputs)
});
export { developerportal_dashboards_tabs_analytics_unclaimedcredentials2 as "developerPortal.dashboards.tabs.analytics.unclaimedCredentials" }