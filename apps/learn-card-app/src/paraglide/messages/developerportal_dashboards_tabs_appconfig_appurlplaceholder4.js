/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Appurlplaceholder4Inputs */

const en_developerportal_dashboards_tabs_appconfig_appurlplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Appurlplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://your-app.com`)
};

const es_developerportal_dashboards_tabs_appconfig_appurlplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Appurlplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://tu-app.com`)
};

const fr_developerportal_dashboards_tabs_appconfig_appurlplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Appurlplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://votre-app.com`)
};

const ar_developerportal_dashboards_tabs_appconfig_appurlplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Appurlplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://your-app.com`)
};

/**
* | output |
* | --- |
* | "https://your-app.com" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Appurlplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_appurlplaceholder4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Appurlplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Appurlplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_appurlplaceholder4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_appurlplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_appurlplaceholder4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_appurlplaceholder4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_appurlplaceholder4 as "developerPortal.dashboards.tabs.appConfig.appUrlPlaceholder" }