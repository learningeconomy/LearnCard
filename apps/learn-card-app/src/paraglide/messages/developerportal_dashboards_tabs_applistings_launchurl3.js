/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Launchurl3Inputs */

const en_developerportal_dashboards_tabs_applistings_launchurl3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Launchurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch URL`)
};

const es_developerportal_dashboards_tabs_applistings_launchurl3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Launchurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Lanzamiento`)
};

const fr_developerportal_dashboards_tabs_applistings_launchurl3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Launchurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Lancement`)
};

const ar_developerportal_dashboards_tabs_applistings_launchurl3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Launchurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط الإطلاق`)
};

/**
* | output |
* | --- |
* | "Launch URL" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Launchurl3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_launchurl3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Launchurl3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Launchurl3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_launchurl3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_launchurl3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_launchurl3(inputs)
	return ar_developerportal_dashboards_tabs_applistings_launchurl3(inputs)
});
export { developerportal_dashboards_tabs_applistings_launchurl3 as "developerPortal.dashboards.tabs.appListings.launchUrl" }