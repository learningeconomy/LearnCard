/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Export_Results1Inputs */

const en_developerportal_dashboards_export_results1 = /** @type {(inputs: Developerportal_Dashboards_Export_Results1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} results`)
};

const es_developerportal_dashboards_export_results1 = /** @type {(inputs: Developerportal_Dashboards_Export_Results1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} resultados`)
};

const fr_developerportal_dashboards_export_results1 = /** @type {(inputs: Developerportal_Dashboards_Export_Results1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} résultats`)
};

const ar_developerportal_dashboards_export_results1 = /** @type {(inputs: Developerportal_Dashboards_Export_Results1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} نتائج`)
};

/**
* | output |
* | --- |
* | "{count} results" |
*
* @param {Developerportal_Dashboards_Export_Results1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_export_results1 = /** @type {((inputs: Developerportal_Dashboards_Export_Results1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Export_Results1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_export_results1(inputs)
	if (locale === "es") return es_developerportal_dashboards_export_results1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_export_results1(inputs)
	return ar_developerportal_dashboards_export_results1(inputs)
});
export { developerportal_dashboards_export_results1 as "developerPortal.dashboards.export.results" }