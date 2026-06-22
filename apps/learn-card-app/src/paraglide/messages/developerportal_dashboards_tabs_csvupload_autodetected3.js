/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Autodetected3Inputs */

const en_developerportal_dashboards_tabs_csvupload_autodetected3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Autodetected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-detected`)
};

const es_developerportal_dashboards_tabs_csvupload_autodetected3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Autodetected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-detectado`)
};

const fr_developerportal_dashboards_tabs_csvupload_autodetected3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Autodetected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-détecté`)
};

const ar_developerportal_dashboards_tabs_csvupload_autodetected3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Autodetected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الكشف تلقائيًا`)
};

/**
* | output |
* | --- |
* | "Auto-detected" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Autodetected3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_autodetected3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Autodetected3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Autodetected3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_autodetected3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_autodetected3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_autodetected3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_autodetected3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_autodetected3 as "developerPortal.dashboards.tabs.csvUpload.autoDetected" }