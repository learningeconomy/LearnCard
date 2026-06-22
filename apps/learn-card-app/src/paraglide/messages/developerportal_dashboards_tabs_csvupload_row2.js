/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Row2Inputs */

const en_developerportal_dashboards_tabs_csvupload_row2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Row2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Row`)
};

const es_developerportal_dashboards_tabs_csvupload_row2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Row2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fila`)
};

const fr_developerportal_dashboards_tabs_csvupload_row2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Row2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ligne`)
};

const ar_developerportal_dashboards_tabs_csvupload_row2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Row2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صف`)
};

/**
* | output |
* | --- |
* | "Row" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Row2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_row2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Row2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Row2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_row2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_row2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_row2(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_row2(inputs)
});
export { developerportal_dashboards_tabs_csvupload_row2 as "developerPortal.dashboards.tabs.csvUpload.row" }