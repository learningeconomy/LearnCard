/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Uploadcsv3Inputs */

const en_developerportal_dashboards_tabs_csvupload_uploadcsv3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Uploadcsv3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload CSV`)
};

const es_developerportal_dashboards_tabs_csvupload_uploadcsv3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Uploadcsv3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir CSV`)
};

const fr_developerportal_dashboards_tabs_csvupload_uploadcsv3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Uploadcsv3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger le CSV`)
};

const ar_developerportal_dashboards_tabs_csvupload_uploadcsv3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Uploadcsv3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحميل CSV`)
};

/**
* | output |
* | --- |
* | "Upload CSV" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Uploadcsv3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_uploadcsv3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Uploadcsv3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Uploadcsv3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_uploadcsv3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_uploadcsv3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_uploadcsv3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_uploadcsv3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_uploadcsv3 as "developerPortal.dashboards.tabs.csvUpload.uploadCsv" }