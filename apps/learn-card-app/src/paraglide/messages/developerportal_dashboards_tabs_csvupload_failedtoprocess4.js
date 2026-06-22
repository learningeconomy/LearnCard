/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Failedtoprocess4Inputs */

const en_developerportal_dashboards_tabs_csvupload_failedtoprocess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Failedtoprocess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to process CSV`)
};

const es_developerportal_dashboards_tabs_csvupload_failedtoprocess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Failedtoprocess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al procesar CSV`)
};

const fr_developerportal_dashboards_tabs_csvupload_failedtoprocess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Failedtoprocess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du traitement du CSV`)
};

const ar_developerportal_dashboards_tabs_csvupload_failedtoprocess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Failedtoprocess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل معالجة CSV`)
};

/**
* | output |
* | --- |
* | "Failed to process CSV" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Failedtoprocess4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_failedtoprocess4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Failedtoprocess4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Failedtoprocess4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_failedtoprocess4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_failedtoprocess4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_failedtoprocess4(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_failedtoprocess4(inputs)
});
export { developerportal_dashboards_tabs_csvupload_failedtoprocess4 as "developerPortal.dashboards.tabs.csvUpload.failedToProcess" }