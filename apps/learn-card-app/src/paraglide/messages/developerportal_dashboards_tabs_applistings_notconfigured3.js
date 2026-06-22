/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Notconfigured3Inputs */

const en_developerportal_dashboards_tabs_applistings_notconfigured3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Notconfigured3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not configured`)
};

const es_developerportal_dashboards_tabs_applistings_notconfigured3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Notconfigured3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No configurado`)
};

const fr_developerportal_dashboards_tabs_applistings_notconfigured3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Notconfigured3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non configuré`)
};

const ar_developerportal_dashboards_tabs_applistings_notconfigured3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Notconfigured3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير مهيأ`)
};

/**
* | output |
* | --- |
* | "Not configured" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Notconfigured3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_notconfigured3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Notconfigured3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Notconfigured3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_notconfigured3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_notconfigured3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_notconfigured3(inputs)
	return ar_developerportal_dashboards_tabs_applistings_notconfigured3(inputs)
});
export { developerportal_dashboards_tabs_applistings_notconfigured3 as "developerPortal.dashboards.tabs.appListings.notConfigured" }