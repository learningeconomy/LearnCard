/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Csvupload_Processedrows3Inputs */

const en_developerportal_dashboards_tabs_csvupload_processedrows3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Processedrows3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Processed ${i?.count} rows`)
};

const es_developerportal_dashboards_tabs_csvupload_processedrows3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Processedrows3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Procesadas ${i?.count} filas`)
};

const fr_developerportal_dashboards_tabs_csvupload_processedrows3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Processedrows3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} lignes traitées`)
};

const ar_developerportal_dashboards_tabs_csvupload_processedrows3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Processedrows3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تمت معالجة ${i?.count} صف`)
};

/**
* | output |
* | --- |
* | "Processed {count} rows" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Processedrows3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_processedrows3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Csvupload_Processedrows3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Processedrows3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_processedrows3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_processedrows3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_processedrows3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_processedrows3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_processedrows3 as "developerPortal.dashboards.tabs.csvUpload.processedRows" }