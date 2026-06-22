/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Results2Inputs */

const en_developerportal_dashboards_tabs_csvupload_results2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Results2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Results`)
};

const es_developerportal_dashboards_tabs_csvupload_results2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Results2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resultados`)
};

const fr_developerportal_dashboards_tabs_csvupload_results2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Results2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résultats`)
};

const ar_developerportal_dashboards_tabs_csvupload_results2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Results2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النتائج`)
};

/**
* | output |
* | --- |
* | "Results" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Results2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_results2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Results2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Results2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_results2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_results2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_results2(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_results2(inputs)
});
export { developerportal_dashboards_tabs_csvupload_results2 as "developerPortal.dashboards.tabs.csvUpload.results" }