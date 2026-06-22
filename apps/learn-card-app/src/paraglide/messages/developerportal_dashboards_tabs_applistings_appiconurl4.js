/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Appiconurl4Inputs */

const en_developerportal_dashboards_tabs_applistings_appiconurl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Appiconurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Icon URL`)
};

const es_developerportal_dashboards_tabs_applistings_appiconurl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Appiconurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL del Icono de la App`)
};

const fr_developerportal_dashboards_tabs_applistings_appiconurl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Appiconurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de l'icône de l'App`)
};

const ar_developerportal_dashboards_tabs_applistings_appiconurl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Appiconurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط أيقونة التطبيق`)
};

/**
* | output |
* | --- |
* | "App Icon URL" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Appiconurl4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_appiconurl4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Appiconurl4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Appiconurl4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_appiconurl4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_appiconurl4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_appiconurl4(inputs)
	return ar_developerportal_dashboards_tabs_applistings_appiconurl4(inputs)
});
export { developerportal_dashboards_tabs_applistings_appiconurl4 as "developerPortal.dashboards.tabs.appListings.appIconUrl" }