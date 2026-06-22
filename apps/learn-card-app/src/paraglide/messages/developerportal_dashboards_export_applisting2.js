/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Export_Applisting2Inputs */

const en_developerportal_dashboards_export_applisting2 = /** @type {(inputs: Developerportal_Dashboards_Export_Applisting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Listing`)
};

const es_developerportal_dashboards_export_applisting2 = /** @type {(inputs: Developerportal_Dashboards_Export_Applisting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listado de App`)
};

const fr_developerportal_dashboards_export_applisting2 = /** @type {(inputs: Developerportal_Dashboards_Export_Applisting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annonce d'App`)
};

const ar_developerportal_dashboards_export_applisting2 = /** @type {(inputs: Developerportal_Dashboards_Export_Applisting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قائمة التطبيق`)
};

/**
* | output |
* | --- |
* | "App Listing" |
*
* @param {Developerportal_Dashboards_Export_Applisting2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_export_applisting2 = /** @type {((inputs?: Developerportal_Dashboards_Export_Applisting2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Export_Applisting2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_export_applisting2(inputs)
	if (locale === "es") return es_developerportal_dashboards_export_applisting2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_export_applisting2(inputs)
	return ar_developerportal_dashboards_export_applisting2(inputs)
});
export { developerportal_dashboards_export_applisting2 as "developerPortal.dashboards.export.appListing" }